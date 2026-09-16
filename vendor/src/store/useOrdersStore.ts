import { create } from "zustand";
import { apiGet, apiPost } from "@/services/apiClient";
import { FoodOrder, FoodOrderStatus } from "@/types";

type OrdersState = {
  orders: FoodOrder[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  transition: (id: string, to: FoodOrderStatus) => Promise<FoodOrder>;
  getOrder: (id: string) => FoodOrder | undefined;
  fetchOrder: (id: string) => Promise<void>;
  clear: () => void;
};

// Realtime events (order:new, order:update) and the 6s poll can fire at the
// same instant; funnelling concurrent refreshes through one in-flight promise
// avoids overlapping snapshot requests racing each other.
let refreshInFlight: Promise<void> | null = null;

// GET /api/v1/orders is already scoped server-side to this vendor's owned
// restaurant(s) — this store is just a cache of that response.
export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  refresh: async () => {
    if (refreshInFlight) return refreshInFlight;
    set({ loading: true, error: null });
    refreshInFlight = (async () => {
      try {
        const data = await apiGet<{ orders: FoodOrder[] }>("/api/v1/orders");
        set({ orders: data.orders, loading: false });
      } catch (e) {
        set({ loading: false, error: e instanceof Error ? e.message : "Couldn't load orders" });
      } finally {
        refreshInFlight = null;
      }
    })();
    return refreshInFlight;
  },

  transition: async (id, to) => {
    const data = await apiPost<{ order: FoodOrder }>(`/api/v1/orders/${id}/transition`, { to });
    set({ orders: get().orders.map((o) => (o.id === id ? data.order : o)) });
    return data.order;
  },

  getOrder: (id) => get().orders.find((o) => o.id === id),

  fetchOrder: async (id) => {
    try {
      const data = await apiGet<{ order: FoodOrder }>(`/api/v1/orders/${id}`);
      set({ orders: get().orders.map((o) => (o.id === id ? data.order : o)) });
    } catch {}
  },

  clear: () => set({ orders: [], loading: false, error: null }),
}));