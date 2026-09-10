import { create } from "zustand";

export type MapPickResult = {
  latitude: number;
  longitude: number;
  street: string;
  city: string;
  state: string;
  pincode: string;
  address: string;
};

type MapPickState = {
  result: MapPickResult | null;
  setResult: (result: MapPickResult) => void;
  consume: () => MapPickResult | null;
};

// Transient channel between the map-picker route and the address form.
// expo-router cannot pass structured objects back through router.back(), so a
// confirmed pin travels here. It holds one result, is never persisted, and
// carries no address list — the address store stays the source of truth.
export const useMapPickStore = create<MapPickState>((set, get) => ({
  result: null,
  setResult: (result) => set({ result }),
  consume: () => {
    const result = get().result;
    set({ result: null });
    return result;
  },
}));