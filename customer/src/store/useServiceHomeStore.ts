import { create } from "zustand";
import { serviceOrderService, ServiceOrder, ServiceProduct } from "@/services/ServiceOrderService";
import { ServiceType } from "@/types";

type LoadState = "idle" | "loading" | "loaded" | "error";

type ServiceHomeState = {
  products: Partial<Record<ServiceType, ServiceProduct[]>>;
  productsState: Partial<Record<ServiceType, LoadState>>;
  loadProducts: (service: ServiceType, force?: boolean) => Promise<void>;

  quantity: Partial<Record<ServiceType, Record<string, number>>>;
  setQuantity: (service: ServiceType, productId: string, delta: number) => void;
  clearCart: (service: ServiceType) => void;

  favorites: Partial<Record<ServiceType, Record<string, boolean>>>;
  toggleFavorite: (service: ServiceType, productId: string) => void;

  trips: Partial<Record<ServiceType, ServiceOrder[]>>;
  tripsState: Partial<Record<ServiceType, LoadState>>;
  loadTrips: (service: ServiceType, force?: boolean) => Promise<void>;
};

// Products and trips are cached per service once fetched, so switching tabs
// back and forth doesn't re-hit the API on every toggle (perf requirement).
export const useServiceHomeStore = create<ServiceHomeState>((set, get) => ({
  products: {},
  productsState: {},
  loadProducts: async (service, force = false) => {
    if (get().productsState[service] === "loaded" && !force) return;
    set({ productsState: { ...get().productsState, [service]: "loading" } });
    try {
      const rows = await serviceOrderService.products(service);
      set({
        products: { ...get().products, [service]: rows },
        productsState: { ...get().productsState, [service]: "loaded" },
      });
    } catch {
      set({ productsState: { ...get().productsState, [service]: "error" } });
    }
  },

  quantity: {},
  setQuantity: (service, productId, delta) => {
    const current: Record<string, number> = get().quantity[service] ?? {};
    const next = Math.max(0, Math.min(20, (current[productId] ?? 0) + delta));
    set({ quantity: { ...get().quantity, [service]: { ...current, [productId]: next } } });
  },
  clearCart: (service) => {
    const quantity = { ...get().quantity };
    delete quantity[service];
    set({ quantity });
  },

  favorites: {},
  toggleFavorite: (service, productId) => {
    const current: Record<string, boolean> = get().favorites[service] ?? {};
    set({ favorites: { ...get().favorites, [service]: { ...current, [productId]: !current[productId] } } });
  },

  trips: {},
  tripsState: {},
  loadTrips: async (service, force = false) => {
    if (get().tripsState[service] === "loaded" && !force) return;
    set({ tripsState: { ...get().tripsState, [service]: "loading" } });
    try {
      const all = await serviceOrderService.activity();
      set({
        trips: { ...get().trips, [service]: all.filter((o) => o.service === service).slice(0, 5) },
        tripsState: { ...get().tripsState, [service]: "loaded" },
      });
    } catch {
      set({ tripsState: { ...get().tripsState, [service]: "error" } });
    }
  },
}));

export function matchesCategory(product: ServiceProduct, keywords: string[]): boolean {
  if (!keywords.length) return true;
  const hay = `${product.name} ${product.description}`.toLowerCase();
  return keywords.some((k) => hay.includes(k.toLowerCase()));
}

// Stable empty defaults. Returning a module-level constant (instead of a
// fresh `[]` / `{}` per call) keeps zustand's snapshot reference-stable, so
// consumers can use these in useEffect/useMemo without causing re-render
// loops or dependency churn.
const EMPTY_PRODUCTS: ServiceProduct[] = [];
const EMPTY_QUANTITY: Record<string, number> = {};
const EMPTY_FAVORITES: Record<string, boolean> = {};
const EMPTY_TRIPS: ServiceOrder[] = [];

export function useServiceProducts(service: ServiceType): ServiceProduct[] {
  return useServiceHomeStore((s) => s.products[service] ?? EMPTY_PRODUCTS);
}

export function useServiceQuantity(service: ServiceType): Record<string, number> {
  return useServiceHomeStore((s) => s.quantity[service] ?? EMPTY_QUANTITY);
}

export function useServiceFavorites(service: ServiceType): Record<string, boolean> {
  return useServiceHomeStore((s) => s.favorites[service] ?? EMPTY_FAVORITES);
}

export function useServiceTrips(service: ServiceType): ServiceOrder[] {
  return useServiceHomeStore((s) => s.trips[service] ?? EMPTY_TRIPS);
}