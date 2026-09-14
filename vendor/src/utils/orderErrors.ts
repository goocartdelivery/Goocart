import { ApiError } from "@/services/apiClient";

/**
 * Maps an order API failure to a human, customer-friendly message (requirement:
 * never surface raw server errors). Shared by the Orders list and the order
 * detail screen so error phrasing stays consistent.
 */
export function mapOrderApiError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.code === "ORDER_EXPIRED" || e.code === "CONFLICT" || e.status === 409) return "This order is no longer available.";
    if (e.code === "FORBIDDEN" || e.status === 403) return "You don't have permission to do this.";
    if (e.code === "ORDER_NOT_FOUND" || e.status === 404) return "This order could not be found.";
    if (e.status === 401) return "Your session has expired. Please sign in again.";
    if (e.code === "NETWORK_ERROR" || e.code === "TIMEOUT") return "Unable to connect to Goocart. Check your connection and try again.";
    return e.message;
  }
  return e instanceof Error ? e.message : "Something went wrong. Please try again.";
}