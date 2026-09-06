import { BillBreakdown, CartLineItem, Coupon, CouponEligibility } from "@/types";
import { PricingSettings } from "@/store/usePricingStore";
import { eligibleCouponSubtotal } from "@/services/CouponService";

export function lineItemTotal(unitPrice: number, quantity: number): number {
  return Math.round(unitPrice * quantity);
}

export function itemTotal(items: CartLineItem[]): number {
  return items.reduce((sum, i) => sum + i.lineTotal, 0);
}

/**
 * The ONE eligibility engine. Every surface (offer suggestions, the
 * free-delivery bar, coupon submission, and the bill itself) must derive its
 * "Eligible / Not Eligible / add ₹X more" decision from this function and from
 * the same `discountBase`, otherwise the offer card and the bill will disagree.
 *
 * `discountBase` mirrors exactly what the bill uses: the eligible subtotal
 * (target-scoped) capped by what remains after the platform's restaurant
 * discount. Capping by `afterRestaurantDiscount` matters because a coupon's
 * min-order is evaluated against the amount the customer actually pays for
 * items — not the pre-discount total.
 */
export function couponEligibility(coupon: Coupon | null, restaurantId: string | null, items: CartLineItem[], settings: PricingSettings): CouponEligibility | null {
  if (!coupon || items.length === 0) return null;

  const subtotal = itemTotal(items);
  const restaurantDiscount = subtotal >= settings.restaurantDiscountThreshold ? settings.restaurantDiscountAmount : 0;
  const afterRestaurantDiscount = subtotal - restaurantDiscount;

  const eligibleBiz = eligibleCouponSubtotal(coupon, restaurantId, items);
  const discountBase = Math.min(afterRestaurantDiscount, eligibleBiz);

  if (eligibleBiz <= 0) {
    return { eligible: false, reason: "NOT_APPLICABLE", shortfall: 0, discountBase: 0 };
  }
  if (discountBase < coupon.minOrder) {
    return { eligible: false, reason: "MIN_NOT_REACHED", shortfall: Math.max(0, coupon.minOrder - discountBase), discountBase };
  }
  return { eligible: true, reason: "NONE", shortfall: 0, discountBase };
}

/**
 * The rupee discount a coupon yields, computed on `discountBase`.
 *
 * FREE_DELIVERY is deliberately NOT counted here: it never reduces the payable
 * subtotal — it waives the delivery fee, which `calculateBill` applies by
 * zeroing `deliveryFee` (never as a rupee "couponDiscount" line). Counting it
 * as both a separate delivery-fee waiver AND a rupee discount would
 * double-count the benefit, which is the exact bug this module exists to kill.
 */
export function couponDiscount(coupon: Coupon | null, discountBase: number): number {
  if (!coupon) return 0;
  if (discountBase < coupon.minOrder) return 0;
  if (coupon.type === "FREE_DELIVERY") return 0;
  if (coupon.type === "FLAT") return Math.min(coupon.value, discountBase);
  const pct = (discountBase * coupon.value) / 100;
  return Math.round(coupon.maxDiscount ? Math.min(pct, coupon.maxDiscount) : pct);
}

/**
 * The single pricing pass for the FOOD cart. Every amount shown in the cart,
 * on checkout, and on the payment screen flows from this one function, which
 * mirrors server/src/lib/pricing.ts exactly. The server still re-derives the
 * real bill at order time — this is the display-side source of truth so the UI
 * never shows a number the backend will not charge.
 *
 * Returns the standard BillBreakdown numbers PLUS the coupon state decided in
 * the same pass, so eligibility, the free-delivery bar and the bill can never
 * disagree.
 */
export function calculateBill(
  items: CartLineItem[],
  coupon: Coupon | null,
  tip: number,
  settings: PricingSettings,
  restaurantId: string | null = null,
): BillBreakdown {
  const subtotal = itemTotal(items);
  const restaurantDiscount = subtotal >= settings.restaurantDiscountThreshold ? settings.restaurantDiscountAmount : 0;
  const afterRestaurantDiscount = subtotal - restaurantDiscount;

  const eligibility = couponEligibility(coupon, restaurantId, items, settings);
  const freeDeliveryApplied = !!eligibility?.eligible && coupon?.type === "FREE_DELIVERY";
  // Discount base is capped by the restaurant discount exactly as the backend
  // does, so a FREE_DELIVERY coupon that is selected but not (yet) minimumed
  // still shows the real delivery fee.
  const coup = eligibility?.eligible ? couponDiscount(coupon, eligibility.discountBase) : 0;

  const deliveryFee = freeDeliveryApplied ? 0 : settings.deliveryFee;
  const taxableBase = Math.max(0, afterRestaurantDiscount - coup);
  const taxes = Math.round(taxableBase * (settings.taxRatePercent / 100));
  const total = taxableBase + deliveryFee + settings.platformFee + taxes + (Number.isFinite(tip) && tip > 0 ? Math.round(tip) : 0);

  return {
    itemTotal: subtotal,
    restaurantDiscount,
    couponDiscount: coup,
    deliveryFee,
    platformFee: settings.platformFee,
    taxes,
    tip: Number.isFinite(tip) && tip > 0 ? Math.round(tip) : 0,
    total: Math.round(total),
    couponEligibility: eligibility,
    freeDeliveryApplied,
    couponBenefitsDelivery: !!(coupon && coupon.type === "FREE_DELIVERY" && eligibility?.eligible),
  };
}
