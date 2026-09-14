import { create } from "zustand";
import { ServiceProduct } from "@/services/ServiceOrderService";

// Currently-open product for the shared ProductDetailSheet. Any product card
// (home carousel, "All" grid, subcategory grid) opens it via open(product);
// the sheet is mounted once at the root layout so it works from any screen.
type ProductDetailState = {
  product: ServiceProduct | null;
  open: (product: ServiceProduct) => void;
  close: () => void;
};

export const useProductDetailStore = create<ProductDetailState>((set) => ({
  product: null,
  open: (product) => set({ product }),
  close: () => set({ product: null }),
}));