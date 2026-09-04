import { useCallback, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { colors, spacing, typography } from "@/theme";
import { CartHeader } from "@/components/cart/CartHeader";
import { RestaurantSummary } from "@/components/cart/RestaurantSummary";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { CouponSection, CouponSuggestion } from "@/components/cart/CouponSection";
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
import { useCatalogStore } from "@/store/useCatalogStore";
import { useSelectedAddress } from "@/store/useAddressStore";
import { validateCoupon } from "@/services/CouponService";
import { restaurantService } from "@/services/RestaurantService";
import { CartLineItem, Restaurant } from "@/types";

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

  const handleStoreInc = (lineId: string) => {
    const item = storeItems.find((i) => i.lineId === lineId);
    if (!item) return;
    storeAdd(storeProductRef({ id: item.productId, service: item.service, name: item.name, imageUrl: item.imageUrl, price: item.unitPrice }));
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
    Alert.alert("Clear Store Cart?", "This will remove all Grocery, Vegetables and Mart items from your Store Cart.", [
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

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [customTip, setCustomTip] = useState("");

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

  const suggestions = useMemo<CouponSuggestion[]>(() => {
    if (couponCode || items.length === 0) return [];
    const result: CouponSuggestion[] = [];
    for (const c of coupons) {
      if (result.length >= 2) break;
      const v = validateCoupon(coupons, c.code, restaurantId, items, undefined);
      result.push({ code: c.code, title: c.title || c.description, available: v.ok });
    }
    return result;
  }, [coupons, couponCode, restaurantId, items]);

  const savings = bill.restaurantDiscount + bill.couponDiscount;

  const etaText = restaurant ? `${restaurant.deliveryTimeMin}–${restaurant.deliveryTimeMax} min` : null;

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
    updateQty(item.lineId, delta);
  };

  const submitCoupon = (code?: string) => {
    const rawCode = code ?? couponInput.trim();
    if (!rawCode) return;
    const result = validateCoupon(coupons, rawCode, restaurantId, items, couponCode ?? undefined);
    if (!result.ok) {
      setCouponError(result.message);
      return;
    }
    applyCoupon(result.coupon.code);
    setCouponError("");
    setCouponInput("");
  };

  const addMore = () => {
    if (restaurantId) router.push({ pathname: "/food/restaurant/[id]", params: { id: restaurantId } });
  };

  const foodHasItems = items.length > 0;
  const storeHasItems = storeItems.length > 0;
  const headerCount = totalItems + storeItemCount;

  if (!foodHasItems && !storeHasItems) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <CartHeader itemCount={0} restaurantName={null} />
        <EmptyCart onExplore={() => router.push("/food")} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <CartHeader itemCount={headerCount} restaurantName={restaurantName} onClear={foodHasItems ? handleClear : undefined} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex} keyboardVerticalOffset={4}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {foodHasItems ? (
            <View style={styles.domain}>
              <Text style={styles.domainLabel}>FOOD ORDER</Text>
              <RestaurantSummary restaurantName={restaurantName} area={restaurant?.area} etaText={etaText} onAddMore={addMore} />

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
                suggestions={suggestions}
                onInputChange={(t) => {
                  setCouponInput(t);
                  setCouponError("");
                }}
                onApply={() => submitCoupon()}
                onRemove={removeCoupon}
                onApplySuggestion={(code) => submitCoupon(code)}
              />

              <DeliveryInstructions instructions={instructions} onToggle={toggleInstruction} />

              <TipSection
                tip={tip}
                customTip={customTip}
                onSelectPreset={(amount) => setTip(tip === amount ? 0 : amount)}
                onCustomChange={(digits, value) => {
                  setCustomTip(digits);
                  setTip(value);
                }}
              />

              <BillSummary bill={bill} couponCode={couponCode} />

              <CheckoutBar itemCount={totalItems} total={bill.total} savings={savings} onPress={proceedToCheckout} />
            </View>
          ) : null}

          {storeHasItems ? (
            <View style={styles.domain}>
              <StoreCartSection
                items={storeItems}
                bill={storeBill}
                onInc={handleStoreInc}
                onDec={handleStoreDec}
                onRemove={handleStoreRemove}
                onClear={handleStoreClear}
                onCheckout={goToStoreCheckout}
              />
            </View>
          ) : null}
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
  itemsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
});
