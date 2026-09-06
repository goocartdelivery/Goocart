import { apiGet, apiPost } from "@/services/apiClient";
import { RecommendationsResponse, RecCategory, ServiceType } from "@/types";

// Maps the frontend ServiceType to the canonical lowercase category used by
// the recommendation engine (and the backend behaviour-tracking events).
export function serviceToRecCategory(service: ServiceType | string): RecCategory {
  const key = service.toUpperCase();
  if (key === "FOOD") return "food";
  if (key === "GROCERY") return "grocery";
  if (key === "VEGETABLES") return "vegetables";
  if (key === "MART") return "mart";
  return "food";
}

/** Fetches the personalised "Recommended for You" list for a category. */
export async function fetchRecommendations(category: RecCategory, limit = 12): Promise<RecommendationsResponse> {
  return apiGet<RecommendationsResponse>("/api/v1/customer/recommendations", { category, limit });
}

/**
 * Records a user search. Fire-and-forget — personalization should never block
 * the UI, so failures are swallowed here.
 */
export function trackSearch(category: RecCategory, query: string): void {
  void apiPost("/api/v1/customer/behavior", { type: "search", category, query }).catch(() => undefined);
}

export type RecEvent =
  | { type: "VIEW_PRODUCT" | "VIEW_RESTAURANT"; category: RecCategory; refType: "product" | "foodItem" | "restaurant"; refId: string }
  | { type: "ADD_TO_CART" | "REMOVE_FROM_CART" | "PURCHASE" | "FAVORITE"; category: RecCategory; refType: "product" | "foodItem" | "restaurant"; refId: string };

/** Records a behaviour event. Fire-and-forget (see trackSearch). */
export function trackBehavior(event: RecEvent): void {
  void apiPost("/api/v1/customer/behavior", { type: event.type, category: event.category, refType: event.refType, refId: event.refId }).catch(() => undefined);
}
