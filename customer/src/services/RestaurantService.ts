import { apiGet } from "@/services/apiClient";
import { FoodItem, MenuCategory, Restaurant } from "@/types";

export type RestaurantFilter = {
  search?: string;
  minRating?: number;
  maxDeliveryMinutes?: number;
  vegOnly?: boolean;
  withOffers?: boolean;
  cuisine?: string;
};

export type SearchResult = {
  restaurants: Restaurant[];
  items: { id: string; restaurantId: string; restaurantName: string; name: string; price: number; veg: boolean; imageUrl: string | null }[];
};

// A real dish returned by the subcategory-scoped catalog lookup
// (GET /api/v1/catalog/dishes?q=...). Driving the Food subcategory grid.
export type Dish = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  categoryId: string;
  name: string;
  description: string;
  imageUrl: string | null;
  price: number;
  discountPercent: number;
  veg: boolean;
  bestseller: boolean;
  rating: number | null;
};

// Backed by the Goocart catalog API — no restaurant or menu data is bundled
// into the app. Prices, availability and images come from the database at
// runtime, so vendor edits take effect without an app release.
export interface RestaurantServiceInterface {
  listRestaurants(filter?: RestaurantFilter): Promise<Restaurant[]>;
  getRestaurantWithMenu(id: string): Promise<{ restaurant: Restaurant; categories: MenuCategory[]; items: FoodItem[] } | null>;
  searchFood(query: string): Promise<SearchResult>;
  dishesByCategory(keywords: string[]): Promise<Dish[]>;
}

class ApiRestaurantService implements RestaurantServiceInterface {
  async listRestaurants(filter: RestaurantFilter = {}): Promise<Restaurant[]> {
    const data = await apiGet<{ restaurants: Restaurant[] }>("/api/v1/catalog/restaurants", {
      q: filter.search,
      minRating: filter.minRating,
      maxDeliveryMinutes: filter.maxDeliveryMinutes,
      vegOnly: filter.vegOnly ? "true" : undefined,
      withOffers: filter.withOffers ? "true" : undefined,
      cuisine: filter.cuisine,
    });
    return data.restaurants;
  }

  async getRestaurantWithMenu(id: string) {
    try {
      const data = await apiGet<{ restaurant: Restaurant; categories: MenuCategory[]; items: FoodItem[] }>(`/api/v1/catalog/restaurants/${id}`);
      return data;
    } catch (error) {
      if (error instanceof Error && "code" in error && (error as { code: string }).code === "RESTAURANT_NOT_FOUND") return null;
      throw error;
    }
  }

  async searchFood(query: string): Promise<SearchResult> {
    return apiGet<SearchResult>("/api/v1/catalog/search", { q: query });
  }

  async dishesByCategory(keywords: string[]): Promise<Dish[]> {
    const data = await apiGet<{ items: Dish[] }>("/api/v1/catalog/dishes", { q: keywords.join(" ") });
    return data.items;
  }
}

export const restaurantService: RestaurantServiceInterface = new ApiRestaurantService();
