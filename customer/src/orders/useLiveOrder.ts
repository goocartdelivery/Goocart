import { useEffect, useState } from "react";
import { useOrderStore } from "@/store/useOrderStore";
import { useAuthStore } from "@/store/useAuthStore";
import { getSocket } from "@/services/socket";
import { FoodOrder } from "@/types";

const POLL_INTERVAL_MS = 5000;

// The single source of live order data for the Order Details and Tracking
// screens. It owns the polling fallback and the realtime socket subscription
// for one order, so neither screen has to duplicate the listen/reset/cleanup
// wiring. Rider position comes ONLY from a real GPS beat relayed by the
// delivery partner (`order:location`) — never simulated or interpolated.
export function useLiveOrder(id: string | undefined) {
  const cached = useOrderStore((s) => (id ? s.getOrder(id) : undefined));
  const fetchOrder = useOrderStore((s) => s.fetchOrder);
  const token = useAuthStore((s) => s.token);

  const [order, setOrder] = useState<FoodOrder | undefined>(cached);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(!cached);
  const [riderPosition, setRiderPosition] = useState<{ latitude: number; longitude: number } | null>(null);

  // Status/progress polling — a resilient fallback for a missed push (a
  // dropped connection, an app returning from background, etc.).
  useEffect(() => {
    if (!id) return;
    const tick = async () => {
      const result = await fetchOrder(id);
      setOrder((prev) => (result ? { ...result } : prev));
      if (result === null && !cached) setNotFound(true);
      setLoading(false);
    };
    void tick();
    const interval = setInterval(() => void tick(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, fetchOrder]);

  // Realtime push: status changes and live rider GPS beats.
  useEffect(() => {
    if (!id || !token) return;
    const socket = getSocket(token);
    if (!socket) return;

    socket.emit("subscribe:order", id);

    const onUpdate = (payload: { orderId: string }) => {
      if (payload.orderId === id) void fetchOrder(id).then((o) => o && setOrder({ ...o }));
    };
    const onLocation = (payload: { orderId: string; latitude: number; longitude: number }) => {
      if (payload.orderId === id) setRiderPosition({ latitude: payload.latitude, longitude: payload.longitude });
    };

    socket.on("order:update", onUpdate);
    socket.on("order:location", onLocation);

    return () => {
      socket.emit("unsubscribe:order", id);
      socket.off("order:update", onUpdate);
      socket.off("order:location", onLocation);
    };
  }, [id, token, fetchOrder]);

  // A newly-assigned partner (or a screen re-entered mid-delivery) has no live
  // fix yet until their next GPS beat — clear any stale rider from a previous
  // order/partner. Deferred so the effect body never sets state synchronously.
  useEffect(() => {
    const t = setTimeout(() => setRiderPosition(null), 0);
    return () => clearTimeout(t);
  }, [order?.deliveryPartner?.id]);

  return { order, riderPosition, notFound, loading };
}
