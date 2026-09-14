import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, LayoutAnimation, Platform, ScrollView, StyleSheet, Text, UIManager, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { colors, spacing, typography } from "@/theme";
import { CartHeader } from "@/components/cart/CartHeader";
import { RestaurantSummary } from "@/components/cart/RestaurantSummary";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { CouponSection, CouponSuggestion } from "@/components/cart/CouponSection";
import { FreeDeliveryProgress } from "@/components/cart/FreeDeliveryProgress";
import { DeliveryInstructions } from "@/components/cart/DeliveryInstructions";
import { TipSection } from "@/components/cart/TipSection";
import { BillSummary } from "@/components/cart/BillSummary";
import { DeliveryAddressSection } from "@/components/cart/DeliveryAddressSection";
import { EmptyCart } from "@/components/cart/EmptyCart";
import { CheckoutBar } from "@/components/cart/CheckoutBar";
import { StoreCartSection } from "@/components/cart/StoreCartSection";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartBill, useCartItemCount, useCartStore } from "@/store/useCartStore";
import { storeProductRef, useStoreCartBill, useStoreCartStore } from "@/store/useStoreCartStore";
import { usePricingStore } from "@/store/usePricingStore";
import { useCatalogStore } from "@/store/useCatalogStore";
import { useSelectedAddress } from "@/store/useAddressStore";
import { validateCoupon } from "@/services/CouponService";
import { couponEligibility } from "@/services/PricingService";
import { restaurantService } from "@/services/RestaurantService";
import { CartLineItem, Restaurant } from "@/types";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const animate = () => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

export default function CartScreen() {
  const items = useCartStore((s) => s.items);
  const restaurantId = useCartStore((s) => s.restaurantId);
  const restaurantName = useCartStore((s) => s.restaurantName);
  const couponCode = useCartStore((s) => s.couponCode);
  const instructions = useCartStore((s) => s.instructions);
  const tip = useCartStore((s) => s.tip);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeLine = useCartStore((s) => s.removeLine);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const toggleInstruction = useCartStore((s) => s.toggleInstruction);
  const setTip = useCartStore((s) => s.setTip);
  const clear = useCartStore((s) => s.clear);

  const coupons = useCatalogStore((s) => s.coupons);
  const pricing = usePricingStore((s) => s.settings);
  const user = useAuthStore((s) => s.user);
  const selectedAddress = useSelectedAddress();
  const bill = useCartBill();
  const totalItems = useCartItemCount();
  const storeItemCount = useStoreCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const storeItems = useStoreCartStore((s) => s.items);
  const storeBill = useStoreCartBill();
  const storeAdd = useStoreCartStore((s) => s.addItem);
  const storeUpdateQty = useStoreCartStore((s) => s.updateQty);
  const storeRemove = useStoreCartStore((s) => s.removeLine);
  const storeClear = useStoreCartStore((s) => s.clear);

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponNotice, setCouponNotice] = useState("");
  const [customTip, setCustomTip] = useState("");
  const [hideFreeDelivery, setHideFreeDelivery] = useState(false);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!restaurantId) return;
      let cancelled = false;
      restaurantService
        .getRestaurantWithMenu(restaurantId)
        .then((data) => {
          if (!cancelled) setRestaurant(data?.restaurant ?? null);
        })
        .catch(() => {
          if (!cancelled) setRestaurant(null);
        });
      return () => {
        cancelled = true;
      };
    }, [restaurantId])
  );

  // A single eligibility source of truth for the currently-applied coupon,
  // joined to the same pricing pass that produces the bill — so the offer UI
  // and the amounts can never disagree again.
  const appliedCoupon = useMemo(
    () => (couponCode ? coupons.find((c) => c.code.toLowerCase() === couponCode.toLowerCase()) ?? null : null),
    [couponCode, coupons],
  );

  // Revalidation: if the applied coupon stops being effective after a cart
  // change (quantity reduced, an item removed, etc.), drop it automatically.
  // This keeps the cart, the bill, checkout and the backend's authoritative
  // resolveCoupon all in agreement instead of failing at the last step. The
  // notice is surfaced via a microtask so it doesn't trigger a synchronous
  // setState inside the effect body.
  useEffect(() => {
    if (!couponCode) return;
    if (items.length === 0) {
      removeCoupon();
      return;
    }
    const elig = bill.couponEligibility;
    if (!(appliedCoupon && elig && !elig.eligible)) return;
    removeCoupon();
    const code = appliedCoupon.code;
    const message =
      elig.reason === "MIN_NOT_REACHED"
        ? `${code} no longer applies — add eligible items worth ₹${Math.ceil(elig.shortfall)} more to use it.`
        : `${code} was removed as it no longer applies to this cart.`;
    const t = setTimeout(() => setCouponNotice(message), 0);
    return () => clearTimeout(t);
  }, [couponCode, items.length, appliedCoupon, bill.couponEligibility, removeCoupon]);

  const suggestions = useMemo<CouponSuggestion[]>(() => {
    if (couponCode || items.length === 0) return [];
    const result: CouponSuggestion[] = [];
    for (const c of coupons) {
      if (c.type === "FREE_DELIVERY") continue;
      if (result.length >= 3) break;
      const elig = couponEligibility(c, restaurantId, items, pricing);
      result.push({ code: c.code, title: c.title || c.description, available: elig?.eligible ?? false });
    }
    return result;
  }, [coupons, couponCode, restaurantId, items, pricing]);

  // Free-delivery smart savings: driven entirely by the live FREE_DELIVERY
  // coupon's min-order — never hardcoded. "Unlocked" means the cart currently
  // qualifies for free delivery; "effective" means free delivery is actually
  // being applied (the coupon is on and the delivery fee is ₹0 in the bill).
  const freeDeliveryCoupon = useMemo(() => coupons.find((c) => c.type === "FREE_DELIVERY") ?? null, [coupons]);
  const freeDeliveryElig = useMemo(
    () => (freeDeliveryCoupon && items.length ? couponEligibility(freeDeliveryCoupon, restaurantId, items, pricing) : null),
    [freeDeliveryCoupon, restaurantId, items, pricing],
  );
  const freeDeliveryUnlocked = freeDeliveryElig?.eligible ?? false;
  const freeDeliveryEffective = bill.freeDeliveryApplied;

  const savings = bill.restaurantDiscount + bill.couponDiscount;

  const proceedToCheckout = () => {
    if (!user) {
      router.push({ pathname: "/login", params: { returnTo: "/checkout" } });
      return;
    }
    router.push("/checkout");
  };

  const handleClear = () => {
    Alert.alert("Clear cart?", "This will remove all items from your cart.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clear },
    ]);
  };

  const handleRemove = (item: CartLineItem) => {
    Alert.alert(`Remove ${item.name}?`, "This item will be removed from your cart.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeLine(item.lineId) },
    ]);
  };

  const handleQty = (item: CartLineItem, delta: number) => {
    if (item.quantity === 1 && delta < 0) {
      handleRemove(item);
      return;
    }
    animate();
    updateQty(item.lineId, delta);
  };

  const submitCoupon = (code?: string) => {
    const rawCode = code ?? couponInput.trim();
    if (!rawCode) return;
    // Existence + already-applied checks (from the catalog list).
    const exists = validateCoupon(coupons, rawCode, restaurantId, items, couponCode ?? undefined);
    if (!exists.ok && exists.reason !== "MIN_NOT_REACHED" && exists.reason !== "NOT_APPLICABLE") {
      setCouponError(exists.message);
      return;
    }
    if (couponCode && couponCode.toUpperCase() === rawCode.toUpperCase()) {
      setCouponError("This coupon is already applied.");
      return;
    }
    const coupon = coupons.find((c) => c.code.toLowerCase() === rawCode.toLowerCase());
    if (!coupon) {
      setCouponError("This coupon code doesn't exist.");
      return;
    }
    // Eligibility decided by the same engine that prices the bill, so a code
    // that passes here guarantees the order won't be rejected at checkout.
    const elig = couponEligibility(coupon, restaurantId, items, pricing);
    if (!elig?.eligible) {
      setCouponError(
        elig?.reason === "MIN_NOT_REACHED"
          ? `Add eligible items worth ₹${Math.ceil(elig.shortfall)} more to use this coupon.`
          : "This offer does not apply to this cart.",
      );
      return;
    }
    animate();
    applyCoupon(coupon.code);
    setCouponError("");
    setCouponNotice("");
    setCouponInput("");
  };

  const handleRemoveCoupon = () => {
    animate();
    removeCoupon();
  };

  const handleTip = (amount: number) => {
    animate();
    setTip(tip === amount ? 0 : amount);
  };

  const handleStoreInc = (lineId: string) => {
    const item = storeItems.find((i) => i.lineId === lineId);
    if (!item) return;
    animate();
    storeAdd(storeProductRef({ id: item.productId, service: item.service, name: item.name, imageUrl: item.imageUrl, price: item.unitPrice, prescriptionRequired: item.prescriptionRequired }));
  };
  const handleStoreDec = (lineId: string) => storeUpdateQty(lineId, -1);
  const handleStoreRemove = (lineId: string) => {
    const item = storeItems.find((i) => i.lineId === lineId);
    Alert.alert(`Remove ${item?.name ?? "item"}?`, "This item will be removed from your Store Cart.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => storeRemove(lineId) },
    ]);
  };
  const handleStoreClear = () => {
    Alert.alert("Clear Store Cart?", "This will remove all Grocery, Vegetables, Mart and Medicine items from your Store Cart.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: storeClear },
    ]);
  };
  const goToStoreCheckout = () => {
    if (!user) {
      router.push({ pathname: "/login", params: { returnTo: "/checkout/store" } });
      return;
    }
    router.push("/checkout/store");
  };

  const addMore = () => {
    if (restaurantId) router.push({ pathname: "/food/restaurant/[id]", params: { id: restaurantId } });
  };

  const foodHasItems = items.length > 0;
  const storeHasItems = storeItems.length > 0;
  const headerCount = totalItems + storeItemCount;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <CartHeader itemCount={headerCount} restaurantName={restaurantName} onClear={foodHasItems ? handleClear : undefined} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex} keyboardVerticalOffset={4}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* FOOD domain */}
          <View style={styles.domain}>
            <Text style={styles.domainLabel}>FOOD ORDER</Text>
            {foodHasItems ? (
              <>
                <RestaurantSummary restaurant={restaurant} restaurantName={restaurantName} onOpenRestaurant={addMore} onAddMore={addMore} />

                {!hideFreeDelivery && freeDeliveryCoupon ? (
                  <FreeDeliveryProgress
                    qualifyingTotal={bill.itemTotal}
                    deliveryFee={pricing.deliveryFee}
                    freeDeliveryCoupon={freeDeliveryCoupon}
                    unlocked={freeDeliveryUnlocked}
                    effective={freeDeliveryEffective}
                    onApply={() => submitCoupon(freeDeliveryCoupon.code)}
                    onSkip={() => setHideFreeDelivery(true)}
                  />
                ) : null}

                <View style={styles.itemsCard}>
                  {items.map((item) => (
                    <CartItemRow key={item.lineId} item={item} onChangeQty={(d) => handleQty(item, d)} onRemove={() => handleRemove(item)} />
                  ))}
                </View>

                <DeliveryAddressSection address={selectedAddress} onManageAddress={() => router.push("/checkout/address")} />

                <CouponSection
                  appliedCode={couponCode}
                  inputValue={couponInput}
                  error={couponError}
                  notice={couponNotice || null}
                  suggestions={suggestions}
                  savings={bill.couponDiscount}
                  onInputChange={(t) => {
                    setCouponInput(t);
                    setCouponError("");
                  }}
                  onApply={() => submitCoupon()}
                  onRemove={handleRemoveCoupon}
                  onApplySuggestion={(code) => submitCoupon(code)}
                  onViewAll={() => router.push("/(tabs)/home")}
                />

                <DeliveryInstructions instructions={instructions} onToggle={toggleInstruction} />

                <TipSection
                  tip={tip}
                  customTip={customTip}
                  onSelectPreset={handleTip}
                  onCustomChange={(digits, value) => {
                    setCustomTip(digits);
                    animate();
                    setTip(value);
                  }}
                />

                <BillSummary bill={bill} couponCode={couponCode} />

                <CheckoutBar itemCount={totalItems} total={bill.total} savings={savings} onPress={proceedToCheckout} />
              </>
            ) : (
              <EmptyCart mode="food" onExplore={() => router.push("/food")} />
            )}
          </View>

          {/* STORE / GO CART domain */}
          <View style={styles.domain}>
            {storeHasItems ? (
              <StoreCartSection
                items={storeItems}
                bill={storeBill}
                onInc={handleStoreInc}
                onDec={(lineId) => {
                  animate();
                  handleStoreDec(lineId);
                }}
                onRemove={handleStoreRemove}
                onClear={handleStoreClear}
                onCheckout={goToStoreCheckout}
              />
            ) : (
              <View style={styles.storeEmpty}>
                <Text style={[styles.domainLabel, styles.storeDomainLabel]}>GO CART STORE</Text>
                <EmptyCart mode="store" onExplore={() => router.push("/(tabs)/home")} />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xl },
  domain: { gap: spacing.lg },
  domainLabel: { ...typography.eyebrow, color: colors.muted },
  storeDomainLabel: { color: colors.success },
  storeEmpty: { gap: spacing.lg },
  itemsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
});
