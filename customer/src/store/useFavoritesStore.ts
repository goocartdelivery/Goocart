import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { userStorageKey } from "@/services/userKey";

const STORAGE_BASE = "goocart.favorites.v1";

type FavoritesState = {
  restaurantIds: string[];
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  toggle: (restaurantId: string) => void;
  isFavorite: (restaurantId: string) => boolean;
  clear: () => void;
};

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  restaurantIds: [],
  hasHydrated: false,
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(userStorageKey(STORAGE_BASE));
      set({ restaurantIds: raw ? JSON.parse(raw) : [], hasHydrated: true });
    } catch {
      set({ restaurantIds: [], hasHydrated: true });
    }
  },
  toggle: (restaurantId) => {
    const has = get().restaurantIds.includes(restaurantId);
    const restaurantIds = has ? get().restaurantIds.filter((id) => id !== restaurantId) : [...get().restaurantIds, restaurantId];
    set({ restaurantIds });
    void AsyncStorage.setItem(userStorageKey(STORAGE_BASE), JSON.stringify(restaurantIds));
  },
  isFavorite: (restaurantId) => get().restaurantIds.includes(restaurantId),
  clear: () => {
    set({ restaurantIds: [] });
    void AsyncStorage.removeItem(userStorageKey(STORAGE_BASE));
  },
}));
