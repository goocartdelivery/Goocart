import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOrderStore } from "@/store/useOrderStore";
import { useAuthStore } from "@/store/useAuthStore";
import { getSocket } from "@/services/socket";
import { serviceOrderService, ServiceOrder } from "@/services/ServiceOrderService";
import { isFoodOngoing, isServiceOngoing } from "@/orders/orderStatus";
import { FoodOrder } from "@/types";

// A food or store order that is currently live. Used by the floating
// ActiveOrderBar so every screen can surface the customer's in-progress work.
export type ActiveOrder = {
  kind: "food" | "store";
  order: FoodOrder | ServiceOrder;
};

// Centralised active-order state for the floating bar. On mount it pulls the
// latest orders from the backend (so the bar reappears after an app restart, not
// from local state alone) and subscribes to realtime status updates so the bar
// stays live without any manual refresh.
export function useActiveOrders() {
  const foodOrders = useOrderStore((s) => s.orders);
  const foodLoading = useOrderStore((s) => s.loading);
  const refresh = useOrderStore((s) => s.refresh);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [serviceLoading, setServiceLoading] = useState(true);

  const load = useCallback(() => {
    void refresh();
    setServiceLoading(true);
    serviceOrderService
      .activity()
      .then((rows) => setServiceOrders(rows))
      .catch(() => undefined)
      .finally(() => setServiceLoading(false));
  }, [refresh]);

  // Initial backend fetch — deferred so the effect body never sets state
  // synchronously. Runs once on mount (and whenever the identity of `load`
  // changes, i.e. on re-auth).
  useEffect(() => {
    const t = setTimeout(() => load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const active: ActiveOrder[] = useMemo(() => {
    const food: ActiveOrder[] = foodOrders
      .filter((o) => o.serviceType === "FOOD" && isFoodOngoing(o.status))
      .map((order) => ({ kind: "food" as const, order }));
    const store: ActiveOrder[] = serviceOrders
      .filter((o) => isServiceOngoing(o.status))
      .map((order) => ({ kind: "store" as const, order }));
    return [...food, ...store].sort((a, b) => b.order.createdAt.localeCompare(a.order.createdAt));
  }, [foodOrders, serviceOrders]);

  // Realtime: keep the bar in sync when any active order changes server-side.
  const activeFoodIds = useMemo(() => active.filter((a) => a.kind === "food").map((a) => a.order.id), [active]);
  const subscribed = useRef(new Set<string>());

  useEffect(() => {
    if (activeFoodIds.length === 0) return;
    const socket = getSocket(useAuthStore.getState().token);
    if (!socket) return;

    activeFoodIds.forEach((id) => {
      if (!subscribed.current.has(id)) {
        socket.emit("subscribe:order", id);
        subscribed.current.add(id);
      }
    });

    const onUpdate = (payload: { orderId: string }) => {
      if (activeFoodIds.includes(payload.orderId)) void refresh();
    };
    socket.on("order:update", onUpdate);
    return () => {
      socket.off("order:update", onUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFoodIds.join(","), refresh]);

  return {
    activeOrders: active,
    hasActive: active.length > 0,
    loading: foodLoading || serviceLoading,
  };
}
