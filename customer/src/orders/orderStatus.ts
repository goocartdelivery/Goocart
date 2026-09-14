import { FoodOrder, FoodOrderStatus, TERMINAL_ORDER_STATUSES } from "@/types";

// ---------------------------------------------------------------------------
// Unified backend-status → UI-status mapping for the Orders section.
//
// This is the single source of truth the Order List, Order Details and Order
// Tracking screens all read from. It maps the ACTUAL backend enums (food order
// statuses + service/store order statuses) to human friendly labels, groups
// them into the high-level buckets shown to the user, and decides which actions
// are legal for a given status — mirroring the server-side rules in
// server/src/lib/orderState.ts and server/src/routes/partner.ts.
//
// IMPORTANT: a UI state is only rendered if the backend can actually produce
// it. Nothing here invents a status the server never emits.
// ---------------------------------------------------------------------------

// Food statuses that mean "the order will not proceed" (mirrors
// TERMINAL_STATUSES server-side, excluding a successful DELIVERED).
export const FOOD_FAILED_STATUSES: FoodOrderStatus[] = ["VENDOR_REJECTED", "CANCELLED_BY_CUSTOMER", "CANCELLED_BY_ADMIN", "AUTO_CANCELLED", "EXPIRED"];

export type OrderBucket = "ongoing" | "ready" | "completed" | "cancelled";

// A customer may cancel a FOOD order while it is PLACED, VENDOR_ACCEPTED,
// PREPARING, or waiting for a delivery partner (READY_FOR_PICKUP with no
// partner assigned yet). The "no partner yet" part of the READY_FOR_PICKUP
// rule is enforced server-side too (orderState.ts + the cancel route).
export const CUSTOMER_CANCELLABLE_FOOD_STATUSES: FoodOrderStatus[] = ["PLACED", "VENDOR_ACCEPTED", "PREPARING", "READY_FOR_PICKUP"];

// Food status progression shown in the vertical stepper on Order Details /
// Tracking. Matches ORDER_STATUSES server-side.
export const FOOD_STEPPER: FoodOrderStatus[] = [
  "PLACED",
  "VENDOR_ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "DELIVERY_PARTNER_ASSIGNED",
  "GOING_TO_VENDOR",
  "ARRIVED_AT_VENDOR",
  "PICKED_UP",
  "ON_THE_WAY",
  "ARRIVED",
  "DELIVERED",
];

// Store/store-delivery (Grocery, Vegetables, Mart, Parcel) status progression
// shown to the user. Matches partner.ts's deliveryFlow.
export const STORE_STEPPER: string[] = [
  "PLACED",
  "CONFIRMED",
  "PACKING",
  "READY_FOR_PICKUP",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
];

// Bike-taxi ride status progression shown to the user. Matches partner.ts's
// rideFlow plus the pre-claim READY_FOR_PICKUP.
export const RIDE_STEPPER: string[] = [
  "PLACED",
  "CONFIRMED",
  "READY_FOR_PICKUP",
  "PARTNER_ASSIGNED",
  "ARRIVING",
  "IN_PROGRESS",
  "COMPLETED",
];

// Backend service-order statuses that mean "delivered / completed".
const SERVICE_FINAL_STATUSES = ["DELIVERED", "COMPLETED"];

// Backend service-order statuses that mean "cancelled".
const SERVICE_CANCELLED = ["CANCELLED_BY_CUSTOMER", "CANCELLED_BY_ADMIN", "CUSTOMER_CANCELLED"];

export const FOOD_STATUS_LABEL: Record<FoodOrderStatus, string> = {
  PLACED: "Order Placed",
  VENDOR_ACCEPTED: "Restaurant Confirmed",
  PREPARING: "Preparing your order",
  READY_FOR_PICKUP: "Ready for Pickup",
  DELIVERY_PARTNER_ASSIGNED: "Delivery Partner Assigned",
  GOING_TO_VENDOR: "Heading to Restaurant",
  ARRIVED_AT_VENDOR: "At the Restaurant",
  PICKED_UP: "Picked Up",
  ON_THE_WAY: "Out for Delivery",
  ARRIVED: "Arrived",
  DELIVERED: "Delivered",
  VENDOR_REJECTED: "Restaurant Declined",
  CANCELLED_BY_CUSTOMER: "Cancelled by You",
  CANCELLED_BY_ADMIN: "Cancelled by Goocart",
  AUTO_CANCELLED: "Cancelled — No partner available",
  EXPIRED: "Expired — No response",
};

// Human step labels for the food stepper (sub-set of the above but worded for
// the step list, not the one-line status pill).
export const FOOD_STEP_LABEL: Record<FoodOrderStatus, string> = {
  ...FOOD_STATUS_LABEL,
  PLACED: "Order placed",
  VENDOR_ACCEPTED: "Restaurant confirmed",
  PREPARING: "Preparing your order",
  READY_FOR_PICKUP: "Ready for pickup",
  DELIVERY_PARTNER_ASSIGNED: "Delivery partner assigned",
  GOING_TO_VENDOR: "Heading to restaurant",
  ARRIVED_AT_VENDOR: "At the restaurant",
  PICKED_UP: "Picked up",
  ON_THE_WAY: "Out for delivery",
  ARRIVED: "Arrived",
  DELIVERED: "Delivered",
  VENDOR_REJECTED: "Restaurant declined",
  CANCELLED_BY_CUSTOMER: "Cancelled",
  CANCELLED_BY_ADMIN: "Cancelled",
  AUTO_CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

export const SERVICE_STATUS_LABEL: Record<string, string> = {
  READY_FOR_PICKUP: "Order Confirmed",
  PARTNER_ASSIGNED: "Delivery Partner Assigned",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "Out for Delivery",
  DELIVERED: "Delivered",
  ARRIVING: "Partner Arriving",
  IN_PROGRESS: "Ride in Progress",
  COMPLETED: "Completed",
  CANCELLED_BY_CUSTOMER: "Cancelled",
  CANCELLED_BY_ADMIN: "Cancelled",
  CUSTOMER_CANCELLED: "Cancelled",
};

// Generic short label that works for food + service + store. Falls back to a
// humanised version of the raw backend value so an unexpected status never
// renders as raw snake_case garbage.
export function orderStatusLabel(status: string): string {
  if (status in FOOD_STATUS_LABEL) return FOOD_STATUS_LABEL[status as FoodOrderStatus];
  if (status in SERVICE_STATUS_LABEL) return SERVICE_STATUS_LABEL[status];
  return status.replaceAll("_", " ");
}

export function isFoodTerminal(status: FoodOrderStatus): boolean {
  return (TERMINAL_ORDER_STATUSES as readonly string[]).includes(status);
}

export function isFoodCancelled(status: FoodOrderStatus): boolean {
  return FOOD_FAILED_STATUSES.includes(status);
}

export function isFoodOngoing(status: FoodOrderStatus): boolean {
  return !isFoodTerminal(status) && status !== "DELIVERED" && !isFoodCancelled(status);
}

export function isFoodReady(status: FoodOrderStatus): boolean {
  return status === "READY_FOR_PICKUP";
}

export function isServiceReady(status: string): boolean {
  return status === "READY_FOR_PICKUP";
}

export function isServiceOngoing(status: string): boolean {
  return !SERVICE_FINAL_STATUSES.includes(status) && !SERVICE_CANCELLED.includes(status);
}

export function isServiceCompleted(status: string): boolean {
  return SERVICE_FINAL_STATUSES.includes(status);
}

export function isServiceCancelled(status: string): boolean {
  return SERVICE_CANCELLED.includes(status);
}

export function isFoodPlaceableForReorder(status: FoodOrderStatus): boolean {
  return status === "DELIVERED" || isFoodCancelled(status);
}

export function foodBucket(status: FoodOrderStatus): OrderBucket {
  if (isFoodCancelled(status)) return "cancelled";
  if (status === "DELIVERED") return "completed";
  return "ongoing";
}

export function serviceBucket(status: string): OrderBucket {
  if (isServiceCancelled(status)) return "cancelled";
  if (isServiceCompleted(status)) return "completed";
  return "ongoing";
}

// Whether the given food order is currently cancellable by the customer.
export function canCancelFood(status: FoodOrderStatus): boolean {
  return CUSTOMER_CANCELLABLE_FOOD_STATUSES.includes(status);
}

// Whether the platform is (or is still) actively searching for a delivery
// partner for a food order — i.e. the order is ready but no partner is assigned
// yet. This is what powers the "Finding a delivery partner..." countdown and is
// also the exact situation where a customer may still cancel.
export function isFindingPartner(order: Pick<FoodOrder, "status" | "deliveryOfferStatus" | "deliveryPartner">): boolean {
  return (
    order.status === "READY_FOR_PICKUP" &&
    !order.deliveryPartner &&
    (order.deliveryOfferStatus === "OFFERING" || order.deliveryOfferStatus === "EXPIRED" || order.deliveryOfferStatus === undefined)
  );
}

// Remaining seconds before the partner search auto-cancels the order, derived
// from the server-anchored deadline. Returns null when no deadline is in play.
export function partnerSearchRemainingSeconds(order: FoodOrder, nowMs = Date.now()): number | null {
  if (!order.autoCancelDeadlineAt) return null;
  const deadline = new Date(order.autoCancelDeadlineAt).getTime();
  return Math.max(0, Math.ceil((deadline - nowMs) / 1000));
}

// ETA remaining for a food order based on its placed time and the backend's
// estimatedDeliveryMinutes. Returns null when there is nothing to estimate.
export function foodEtaRemaining(order: FoodOrder, nowMs = Date.now()): number | null {
  if (!isFoodOngoing(order.status)) return null;
  const minutesElapsed = Math.floor((nowMs - new Date(order.createdAt).getTime()) / 60000);
  return Math.max(1, order.estimatedDeliveryMinutes - minutesElapsed);
}

// An absolute "arriving by" clock time derived from placed time + ETA, used on
// Order Details. Returns null when there is nothing to estimate.
export function foodEtaArrivalTime(order: FoodOrder): string | null {
  if (!isFoodOngoing(order.status)) return null;
  const eta = foodEtaRemaining(order);
  if (eta === null) return null;
  const arrival = new Date(new Date(order.createdAt).getTime() + order.estimatedDeliveryMinutes * 60000);
  return arrival.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

// Store / service orders carry no estimated-delivery payload today, so any ETA
// is genuinely unavailable — say so rather than invent one.
export const SERVICE_ETA_UNAVAILABLE = "Delivery time unavailable";
