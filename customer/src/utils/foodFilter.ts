import { HomeCategory } from "@/constants/serviceHome";
import { Restaurant } from "@/types";
import { SearchResult } from "@/services/RestaurantService";

// Keyword-based food subcategory filtering. Every food HomeCategory carries a
// `keywords` array (e.g. Biryani -> ["biryani", "rice", "mandi", "dum"]), so
// matching stays fully data-driven: adding a new subcategory only means adding
// it (with its keywords) to HOME_RAW_CATEGORIES.food — no code changes here.
// A null/undefined category means "All Food" (no filter applied).

export function restaurantMatchesCategory(
  r: Pick<Restaurant, "name" | "cuisines">,
  category: HomeCategory | null | undefined,
): boolean {
  if (!category) return true;
  const keywords = category.keywords ?? [];
  if (keywords.length === 0) return true;
  const haystack = [r.name, ...(r.cuisines ?? [])].join(" ").toLowerCase();
  return keywords.some((k) => haystack.includes(k.toLowerCase()));
}

export function itemMatchesCategory(item: { name: string }, category: HomeCategory | null | undefined): boolean {
  if (!category) return true;
  const keywords = category.keywords ?? [];
  if (keywords.length === 0) return true;
  const haystack = item.name.toLowerCase();
  return keywords.some((k) => haystack.includes(k.toLowerCase()));
}

export function filterRestaurantsByCategory(
  list: Restaurant[],
  category: HomeCategory | null | undefined,
): Restaurant[] {
  if (!category) return list;
  return list.filter((r) => restaurantMatchesCategory(r, category));
}

export function filterSearchByCategory(
  result: SearchResult,
  category: HomeCategory | null | undefined,
): SearchResult {
  if (!category) return result;
  return {
    restaurants: result.restaurants.filter((r) => restaurantMatchesCategory(r, category)),
    items: result.items.filter((i) => itemMatchesCategory(i, category)),
  };
}
