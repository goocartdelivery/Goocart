import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { OrderRating } from "@/types";
import { apiGet } from "@/services/apiClient";
import { ratingService } from "@/services/RatingService";
import { userStorageKey } from "@/services/userKey";

const STORAGE_BASE = "goocart.ratings.v1";

type RatingState = {
  ratings: OrderRating[];
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  submitRating: (rating: OrderRating) => Promise<void>;
  ratingFor: (orderId: string) => OrderRating | undefined;
  clear: () => void;
};

export const useRatingStore = create<RatingState>((set, get) => ({
  ratings: [],
  hasHydrated: false,
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(userStorageKey(STORAGE_BASE));
      set({ ratings: raw ? JSON.parse(raw) : [], hasHydrated: true });
    } catch {
      set({ ratings: [], hasHydrated: true });
    }
  },
  submitRating: async (rating) => {
    const saved = await ratingService.submitRating(rating);
    const ratings = [...get().ratings.filter((r) => r.orderId !== saved.orderId), saved];
    set({ ratings });
    await AsyncStorage.setItem(userStorageKey(STORAGE_BASE), JSON.stringify(ratings));
  },
  ratingFor: (orderId) => get().ratings.find((r) => r.orderId === orderId),
  clear: () => {
    set({ ratings: [] });
    void AsyncStorage.removeItem(userStorageKey(STORAGE_BASE));
  },
}));

export async function refreshRatings() {
  const data = await apiGet<{ ratings: OrderRating[] }>("/api/v1/customer/ratings");
  useRatingStore.setState({ ratings: data.ratings, hasHydrated: true });
  await AsyncStorage.setItem(userStorageKey(STORAGE_BASE), JSON.stringify(data.ratings));
}
