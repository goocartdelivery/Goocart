import { create } from "zustand";

// One-at-a-time new-order popup. The queue is fed only from realtime
// order:new events (see useVendorRealtime) and is deduped by order id, so the
// same order can never appear twice even if a duplicate event slips through.
// The Orders list (a different store) is — and stays — the single source of
// truth for what is actually shown in the tab.
export type NewOrderPopupItem = {
  id: string;
  orderNumber: string;
  customerName: string;
  itemCount: number;
  total: number;
  paymentStatus?: string;
  paymentMethod?: string;
};

type PopupState = {
  queue: NewOrderPopupItem[];
  enqueue: (item: NewOrderPopupItem) => void;
  dismiss: (id: string) => void;
  clear: () => void;
};

export const useNewOrderPopupStore = create<PopupState>((set) => ({
  queue: [],
  enqueue: (item) => set((s) => (s.queue.some((q) => q.id === item.id) ? s : { queue: [...s.queue, item] })),
  dismiss: (id) => set((s) => ({ queue: s.queue.filter((q) => q.id !== id) })),
  clear: () => set({ queue: [] }),
}));