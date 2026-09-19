export type ServiceType = "FOOD" | "GROCERY" | "VEGETABLES" | "MART" | "MEDICINE" | "BIKE_TAXI" | "PARCEL";

export type Address = {
  id: string;
  label: "Home" | "Work" | "Other";
  line1: string;
  building?: string;
  street?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  contactName: string;
  contactPhone: string;
  latitude: number;
  longitude: number;
};

export type CustomerUser = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  username?: string | null;
  role?: string;
  isDemo: boolean;
};

// --- Food domain (shapes mirror the /api/v1/catalog DTOs) --------------

export type MenuCategory = {
  id: string;
  name: string;
};

export type FoodVariant = {
  id: string;
  name: string;
  price: number;
};

export type AddonItem = {
  id: string;
  name: string;
  price: number;
};

export type AddonGroup = {
  id: string;
  name: string;
  required: boolean;
  multiSelect: boolean;
  max?: number | null;
  options: AddonItem[];
};

export type FoodItem = {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  imageUrl: string | null;
  price: number;
  veg: boolean;
  rating?: number | null;
  ratingCount?: number | null;
  bestseller?: boolean;
  available: boolean;
  variants?: FoodVariant[];
  addonGroups?: AddonGroup[];
};

export type RestaurantOffer = {
  title: string;
  description?: string | null;
};

export type Restaurant = {
  id: string;
  name: string;
  imageUrl: string | null;
  rating: number;
  ratingCount: number;
  cuisines: string[];
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  distanceKm: number;
  priceForOne?: number | null;
  priceForTwo?: number | null;
  vegOnly: boolean;
  // Restaurant-level dietary tag ("veg" | "non-veg"). Real backend data has no
  // foodType field, so it's derived from vegOnly when normalizing; mock
  // fallback data carries it explicitly. Used for the All/Veg/Non-Veg filter.
  foodType?: "veg" | "non-veg";
  offers: RestaurantOffer[];
  isOpen: boolean;
  area: string;
  latitude: number;
  longitude: number;
};

export type FoodCategory = {
  id: string;
  name: string;
  imageUrl: string;
};

// --- Cart ---------------------------------------------------------------

export type SelectedAddon = { id: string; name: string; price: number };
export type SelectedVariant = { id: string; name: string; price: number };

export type CartLineItem = {
  lineId: string;
  foodItemId: string;
  name: string;
  imageUrl?: string | null;
  veg: boolean;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  selectedVariant?: SelectedVariant;
  selectedAddons: SelectedAddon[];
};

export const DELIVERY_INSTRUCTIONS = ["Don't ring bell", "Leave at door", "Call on arrival", "Avoid plastic cutlery"] as const;
export type DeliveryInstruction = (typeof DELIVERY_INSTRUCTIONS)[number];

// --- Cart domains --------------------------------------------------------

// The cart has two independent domains. FOOD is a single-restaurant cart;
// STORE is the GoCart Store cart that combines Grocery + Vegetables + Mart.
export type CartDomain = "FOOD" | "STORE";

// Store product lines share the GoCart Store cart regardless of which store
// service (Grocery/Vegetables/Mart/Medicine) the product belongs to.
export type StoreCartLineItem = {
  lineId: string;
  productId: string;
  service: "GROCERY" | "VEGETABLES" | "MART" | "MEDICINE";
  name: string;
  imageUrl?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  // Prescription medicines show an Rx badge in the cart and are validated
  // server-side at checkout (prescriptionProvided must be true).
  prescriptionRequired?: boolean;
};

// Mirrors the backend's store-order bill in POST /api/v1/customer/service-orders.
export type StoreCartBill = {
  itemTotal: number;
  couponDiscount: number;
  deliveryFee: number;
  platformFee: number;
  taxes: number;
  tip: number;
  total: number;
};

// --- Coupons --------------------------------------------------------------

export type Coupon = {
  code: string;
  title: string;
  description: string;
  type: "PERCENT" | "FLAT" | "FREE_DELIVERY";
  value: number;
  minOrder: number;
  maxDiscount?: number | null;
  // Optional dietary scoping for offer banners ("veg" | "non-veg"). Real
  // backend coupons carry no foodType (they apply platform-wide) so they always
  // show; mock offers use it to honour the existing veg filter when active.
  foodType?: "veg" | "non-veg";
  // Optional banner image for the "Offers for You" cards. Backend coupons are
  // text-only; mock offers include a food image.
  imageUrl?: string | null;
  targetRestaurantIds: string[];
  targetRestaurantNames: string[];
  targetFoodItemIds: string[];
  targetFoodItemNames: string[];
  targetFoodItems?: {
    id: string;
    restaurantId: string;
    restaurantName: string;
    name: string;
    price: number;
    veg: boolean;
    imageUrl: string | null;
  }[];
  showOnHome: boolean;
};

// --- Home banners -----------------------------------------------------

export type Banner = {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  linkType: "NONE" | "RESTAURANT" | "SERVICE";
  linkTargetId: string | null;
};

// --- Pricing ----------------------------------------------------------

export type CouponEligibility = {
  eligible: boolean;
  reason: "NONE" | "MIN_NOT_REACHED" | "NOT_APPLICABLE" | "NO_ITEMS";
  // How much more eligible-subtotal is needed before the coupon becomes
  // eligible (0 when already eligible). Mirrors the discountBase used by the
  // bill so the UI's "Eligible/Not Eligible / add ₹X more" always matches it.
  shortfall: number;
  // The base the coupon discount is computed on — the same value the bill
  // uses (eligible subtotal capped by what remains after the restaurant
  // discount). Keeping this in one place is what stops the offer card and the
  // bill from disagreeing.
  discountBase: number;
};

export type BillBreakdown = {
  itemTotal: number;
  restaurantDiscount: number;
  couponDiscount: number;
  deliveryFee: number;
  platformFee: number;
  taxes: number;
  tip: number;
  total: number;
  // Coupon state joined to the same pricing pass, so eligibility display,
  // the free-delivery bar and the bill can never disagree again.
  couponEligibility: CouponEligibility | null;
  freeDeliveryApplied: boolean;
  couponBenefitsDelivery: boolean;
};

// --- Orders -------------------------------------------------------------

export const ORDER_STATUSES = [
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
] as const;
// Terminal states an order can also end in. They are not part of the forward
// progress timeline, so they live outside ORDER_STATUSES.
export const TERMINAL_ORDER_STATUSES = ["VENDOR_REJECTED", "CANCELLED_BY_CUSTOMER", "CANCELLED_BY_ADMIN", "AUTO_CANCELLED", "EXPIRED"] as const;
export type FoodOrderStatus = (typeof ORDER_STATUSES)[number] | (typeof TERMINAL_ORDER_STATUSES)[number];

export type OrderStatusEvent = {
  status: FoodOrderStatus;
  at: string;
};

export type PaymentMethod = "UPI" | "GPAY" | "PHONEPE" | "PAYTM" | "CARD" | "NETBANKING" | "WALLET" | "COD";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "NOT_APPLICABLE";

// photoUrl/vehicle/rating are only populated on the single-order detail
// endpoint (GET /orders/:id), not the list endpoint, to avoid an N+1 lookup
// there — see server/src/routes/orders.ts.
export type DeliveryPartnerSummary = {
  id: string;
  name: string | null;
  photoUrl?: string | null;
  vehicleType?: string | null;
  vehicleNumber?: string | null;
  partnerRating?: number | null;
};

export type FoodOrder = {
  id: string;
  orderNumber: string;
  serviceType: "FOOD";
  customerId: string;
  restaurantId: string;
  restaurantName: string;
  restaurantArea: string;
  items: CartLineItem[];
  deliveryAddress: Address;
  instructions: DeliveryInstruction[];
  couponCode?: string;
  bill: BillBreakdown;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: FoodOrderStatus;
  createdAt: string;
  estimatedDeliveryMinutes: number;
  statusHistory: OrderStatusEvent[];
  deliveryPartner?: DeliveryPartnerSummary | null;
  deliveryOtp: string | null;
  restaurantLatitude: number;
  restaurantLongitude: number;
  // Delivery-dispatch metadata: whether offers are out (OFFERING), when the
  // partner search must conclude by, and when a partner was assigned. Used by
  // the "Finding a delivery partner..." countdown and cancellation rules.
  deliveryOfferStatus?: "NONE" | "OFFERING" | "ASSIGNED" | "EXPIRED";
  autoCancelDeadlineAt?: string | null;
  deliveryPartnerAssignedAt?: string | null;
  autoCancellationAt?: string | null;
  cancellationReason?: string | null;
  refund?: { amount: number | null; status: "NONE" | "PENDING" | "PROCESSED" | "FAILED"; at: string | null } | null;
};

// --- Support & ratings ----------------------------------------------------

export const SUPPORT_REASONS = [
  "Order delayed",
  "Missing item",
  "Wrong item",
  "Food quality issue",
  "Payment issue",
  "Delivery partner issue",
  "Refund issue",
  "Other",
] as const;
export type SupportReason = (typeof SUPPORT_REASONS)[number];

export type SupportTicket = {
  id: string;
  orderId: string | null;
  reason: SupportReason;
  details?: string;
  status?: string;
  createdAt: string;
};

export type OrderRating = {
  orderId: string;
  restaurantStars: number;
  foodStars: number;
  deliveryPartnerStars: number;
  comment?: string;
  createdAt: string;
};

// --- Recommendations --------------------------------------------------------
// Shape mirrors GET /api/v1/customer/recommendations. The DTO is deliberately
// flat so a single card component can render both food and store items.

export type RecCategory = "food" | "grocery" | "vegetables" | "mart";

export type RecommendationItem = {
  id: string;
  category: RecCategory;
  name: string;
  description?: string;
  imageUrl: string | null;
  price: number;
  originalPrice: number | null;
  discountPercent: number;
  rating: number | null;
  veg?: boolean | null;
  restaurantId?: string;
  restaurantName?: string;
  service?: string;
  vendorName?: string;
  eta?: string;
  reason: string;
};

export type RecommendationsResponse = {
  category: RecCategory;
  personalized: boolean;
  basedOn: string[];
  items: RecommendationItem[];
};

export type StoreProductRef = {
  productId: string;
  service: string;
  name: string;
  imageUrl?: string | null;
  price: number;
  prescriptionRequired?: boolean;
};
