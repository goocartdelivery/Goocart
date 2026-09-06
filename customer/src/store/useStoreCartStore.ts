import { useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { usePricingStore } from "@/store/usePricingStore";
import { StoreCartBill, StoreCartLineItem } from "@/types";
import { userStorageKey } from "@/services/userKey";

// Base for the per-user store (Grocery/Vegetables/Mart) cart key. Resolved to a
// user-scoped key at read/write time so two accounts never share a store cart.
const STORAGE_BASE = "goocart.storecart.v1";

// The store cart holds products from all three store services (Grocery,
// Vegetables, Mart) together — they all belong to the GoCart Store and are
// checked out as one order. Grocery/Veg/Mart are a single store cart domain,
// intentionally independent from the FOOD cart.
export type StoreProductRef = {
  productId: string;
  service: string;
  name: string;
  imageUrl?: string | null;
  price: number;
};

// Backend `Product.service` is title-cased ("Grocery"); the frontend ServiceType
// is upper-cased ("GROCERY"). Normalise once so a line never depends on the
// source casing of the product feed.
export function normalizeStoreService(service: string): "GROCERY" | "VEGETABLES" | "MART" | "OTHER" {
  const key = service.trim().toUpperCase();
  if (key === "GROCERY" || key === "GRO") return "GROCERY";
  if (key === "VEGETABLES" || key === "VEGETABLE" || key === "VEG") return "VEGETABLES";
  if (key === "MART") return "MART";
  return "OTHER";
}

function storeLineId(productId: string): string {
  return `store|${productId}`;
}

// Maps a backend ServiceProduct onto a StoreProductRef so any store product
// screen (Grocery/Veg/Mart) can hand it straight to the shared store cart.
export function storeProductRef(p: { id: string; service: string; name: string; imageUrl?: string | null; price: number }): StoreProductRef {
  return { productId: p.id, service: p.service, name: p.name, imageUrl: p.imageUrl, price: p.price };
}

type StoreCartState = {
  items: StoreCartLineItem[];
  couponCode: string | null;
  tip: number;

  addItem: (product: StoreProductRef) => void;
  updateQty: (lineId: string, delta: number) => void;
  removeLine: (lineId: string) => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
  setTip: (amount: number) => void;
  clear: () => void;
  hydrate: () => Promise<void>;
};

function persist(state: StoreCartState) {
  void AsyncStorage.setItem(userStorageKey(STORAGE_BASE), JSON.stringify({ items: state.items, couponCode: state.couponCode, tip: state.tip }));
}

export const useStoreCartStore = create<StoreCartState>((set, get) => ({
  items: [],
  couponCode: null,
  tip: 0,

  addItem: (product) => {
    const service = normalizeStoreService(product.service);
    if (service === "OTHER") return;
    const lineId = storeLineId(product.productId);
    const existing = get().items.find((i) => i.lineId === lineId);
    const items = existing
      ? get().items.map((i) =>
          i.lineId === lineId
            ? { ...i, quantity: Math.min(20, i.quantity + 1), lineTotal: Math.round(i.unitPrice * Math.min(20, i.quantity + 1)) }
            : i,
        )
      : [
          ...get().items,
          {
            lineId,
            productId: product.productId,
            service,
            name: product.name,
            imageUrl: product.imageUrl ?? null,
            quantity: 1,
            unitPrice: product.price,
            lineTotal: product.price,
          },
        ];
    set({ items });
    persist(get());
  },

  updateQty: (lineId, delta) => {
    const items = get()
      .items.map((i) =>
        i.lineId === lineId
          ? { ...i, quantity: Math.min(20, Math.max(0, i.quantity + delta)), lineTotal: Math.round(i.unitPrice * Math.min(20, Math.max(0, i.quantity + delta))) }
          : i,
      )
      .filter((i) => i.quantity > 0);
    set({ items, couponCode: items.length ? get().couponCode : null });
    persist(get());
  },

  removeLine: (lineId) => {
    const items = get().items.filter((i) => i.lineId !== lineId);
    set({ items, couponCode: items.length ? get().couponCode : null });
    persist(get());
  },

  applyCoupon: (code) => {
    set({ couponCode: code.toUpperCase() });
    persist(get());
  },
  removeCoupon: () => {
    set({ couponCode: null });
    persist(get());
  },
  setTip: (amount) => {
    set({ tip: Math.max(0, amount) });
    persist(get());
  },
  clear: () => {
    set({ items: [], couponCode: null, tip: 0 });
    void AsyncStorage.removeItem(userStorageKey(STORAGE_BASE));
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(userStorageKey(STORAGE_BASE));
      if (!raw) return;
      const saved = JSON.parse(raw) as { items?: StoreCartLineItem[]; couponCode?: string | null; tip?: number };
      set({ items: saved.items ?? [], couponCode: saved.couponCode ?? null, tip: saved.tip ?? 0 });
    } catch {
      // A corrupt store cart is discarded rather than blocking app start.
    }
  },
}));

export function useStoreCartItemCount(): number {
  const items = useStoreCartStore((s) => s.items);
  return useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
}

// Client-side estimate that mirrors the backend store-order bill exactly
// (itemTotal + delivery + platform + taxes + tip). The server re-derives the
// authoritative total at order time; stores carry no coupons/offers today.
export function useStoreCartBill(): StoreCartBill {
  const items = useStoreCartStore((s) => s.items);
  const tip = useStoreCartStore((s) => s.tip);
  const settings = usePricingStore((s) => s.settings);
  return useMemo(() => {
    const itemTotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const deliveryFee = settings.deliveryFee;
    const platformFee = settings.platformFee;
    const taxes = Math.round((itemTotal * settings.taxRatePercent) / 100);
    const total = itemTotal + deliveryFee + platformFee + taxes + tip;
    return { itemTotal, couponDiscount: 0, deliveryFee, platformFee, taxes, tip, total };
  }, [items, tip, settings]);
}
