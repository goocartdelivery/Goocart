import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { getSocket } from "@/services/socket";
import { useOrdersStore } from "@/store/useOrdersStore";
import { useVendorStore } from "@/store/useVendorStore";
import { useNewOrderPopupStore } from "@/store/useNewOrderPopupStore";
import { FoodOrder } from "@/types";

// order:update payloads whose arrival changes the dashboard's aggregates (an
// order left the PLACED pool, or one reached DELIVERED and grew revenue).
// Refreshing the full dashboard on every status change would be wasteful —
// only these statuses alter the counts/revenue.
const DASHBOARD_COUNT_STATUSES = ["VENDOR_ACCEPTED", "VENDOR_REJECTED", "EXPIRED", "CANCELLED_BY_CUSTOMER", "CANCELLED_BY_ADMIN", "AUTO_CANCELLED", "DELIVERED"];

/**
 * Global realtime coordinator, mounted once at the root layout. Owns every
 * vendor-side socket listener so screens (orders tab, order detail) don't each
 * duplicate a connection or double-fetch on the same event.
 *
 * - new order  → enqueue the one-at-a-time popup, refresh orders + dashboard
 * - order update → refresh orders; refresh dashboard only when statuses change
 * - acceptance overdue → refresh both
 * - (re)connect → re-sync local state with the server (rooms rejoin server-side)
 */
export function useVendorRealtime(): void {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    if (!socket) return;

    const refreshOrders = () => void useOrdersStore.getState().refresh();
    const refreshDashboard = () => void useVendorStore.getState().loadDashboard();

    const onNew = (payload: unknown) => {
      const order = (payload as { order?: FoodOrder } | undefined)?.order;
      if (order?.status === "PLACED") {
        useNewOrderPopupStore.getState().enqueue({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName ?? "New Order",
          itemCount: order.items?.length ?? 0,
          total: order.bill?.total ?? 0,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
        });
      }
      refreshOrders();
      refreshDashboard();
    };

    const onUpdate = (payload: unknown) => {
      const status = (payload as { status?: string } | undefined)?.status;
      refreshOrders();
      if (status && DASHBOARD_COUNT_STATUSES.includes(status)) refreshDashboard();
    };

    const onOverdue = () => {
      refreshOrders();
      refreshDashboard();
    };

    const onConnect = () => {
      refreshOrders();
      refreshDashboard();
    };

    socket.on("order:new", onNew);
    socket.on("order:update", onUpdate);
    socket.on("order:acceptance_overdue", onOverdue);
    socket.on("connect", onConnect);

    return () => {
      socket.off("order:new", onNew);
      socket.off("order:update", onUpdate);
      socket.off("order:acceptance_overdue", onOverdue);
      socket.off("connect", onConnect);
    };
  }, [token]);
}