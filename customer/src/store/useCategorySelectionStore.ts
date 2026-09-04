import { create } from "zustand";
import { HomeCategory } from "@/constants/serviceHome";
import { ServiceType } from "@/types";

export type CategorySelection = { service: ServiceType; category: HomeCategory };

type CategorySelectionState = {
  selection: CategorySelection | null;
  setCategory: (service: ServiceType, category: HomeCategory | null) => void;
  clear: () => void;
};

// Single source of truth for the selected home subcategory, shared across the
// home strip/listing AND the standalone search screen (a different route), so
// search is always scoped to the currently selected subcategory.
export const useCategorySelectionStore = create<CategorySelectionState>((set) => ({
  selection: null,
  setCategory: (service, category) => set({ selection: category ? { service, category } : null }),
  clear: () => set({ selection: null }),
}));

// Returns the active category for a given service, or null when none is
// selected or the stored selection belongs to a different (previously active)
// service — so switching services never leaks a stale subcategory filter.
export function categoryForService(selection: CategorySelection | null, service: ServiceType): HomeCategory | null {
  return selection?.service === service ? selection.category : null;
}
