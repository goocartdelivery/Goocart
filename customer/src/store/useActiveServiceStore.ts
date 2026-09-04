import { create } from "zustand";
import { ServiceType } from "@/types";

type ActiveServiceState = {
  active: ServiceType;
  setActive: (service: ServiceType) => void;
};

// Single source of truth for the selected homepage service portal. Every
// service-driven section (hero, tabs, search, categories, products, offers)
// reads from here so the whole homepage stays synchronized when a tab changes.
export const useActiveServiceStore = create<ActiveServiceState>((set) => ({
  active: "FOOD",
  setActive: (service) => set({ active: service }),
}));