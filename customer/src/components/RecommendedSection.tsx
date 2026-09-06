import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { RemoteImage } from "@/components/RemoteImage";
import { SectionHeader } from "@/components/SectionHeader";
import { SkeletonBlock } from "@/components/SkeletonBlock";
import { colors, radius, spacing, typography } from "@/theme";
import { fetchRecommendations, trackBehavior } from "@/services/RecommendationService";
import { useCartStore } from "@/store/useCartStore";
import { storeProductRef, useStoreCartStore } from "@/store/useStoreCartStore";
import { CartLineItem, RecommendationItem, RecCategory } from "@/types";
import { Icon } from "@/components/Icon";

type Props = {
  category: RecCategory;
  title?: string;
};

type LoadState = "idle" | "loading" | "loaded" | "error";

// Reusable "Recommended for You" strip shared by all four category surfaces
// (Food, Grocery, Vegetables, Mart). Fetching is fully data-driven from the
// backend engine; guests fall back to the platform's popular list. Each card
// is wired to the existing cart domain:
//  - Food -> single-restaurant food cart (with cross-restaurant replace flow)
//  - Store -> the single shared GoCart Store cart across all three store types
export function RecommendedSection({ category, title = "Recommended for You" }: Props) {
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [state, setState] = useState<LoadState>("idle");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await fetchRecommendations(category);
      setItems(res.items);
      setState("loaded");
    } catch {
      setState("error");
    }
  }, [category]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  if (state === "loading" || (state === "idle" && items.length === 0)) {
    return (
      <View style={styles.section}>
        <SectionHeader title={title} subtitle="Personalised picks" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.card}>
              <SkeletonBlock width="100%" height={92} />
              <View style={styles.cardBody}>
                <SkeletonBlock width="80%" height={12} />
                <SkeletonBlock width="40%" height={12} />
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title={title} subtitle="Based on your activity" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
        {items.map((item) => (
          <RecommendationCard key={item.id} item={item} />
        ))}
      </ScrollView>
    </View>
  );
}

function RecommendationCard({ item }: { item: RecommendationItem }) {
  const isFood = item.category === "food";

  // Food cart
  const foodRestaurantName = useCartStore((s) => s.restaurantName);
  const foodItems = useCartStore((s) => s.items);
  const foodAddItem = useCartStore((s) => s.addItem);
  const foodReplace = useCartStore((s) => s.replaceCartWithItem);
  const foodUpdateQty = useCartStore((s) => s.updateQty);

  // Store cart (shared)
  const storeItems = useStoreCartStore((s) => s.items);
  const storeAdd = useStoreCartStore((s) => s.addItem);
  const storeUpdateQty = useStoreCartStore((s) => s.updateQty);

  const foodQty = foodItems.filter((i) => i.foodItemId === item.id).reduce((sum, i) => sum + i.quantity, 0);
  const storeQty = storeItems.find((i) => i.productId === item.id)?.quantity ?? 0;

  const toCartLine = useCallback(
    (): CartLineItem => ({
      lineId: item.id,
      foodItemId: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      veg: item.veg ?? false,
      quantity: 1,
      unitPrice: item.price,
      lineTotal: item.price,
      selectedAddons: [],
    }),
    [item],
  );

  const onAdd = useCallback(() => {
    if (isFood) {
      const line = toCartLine();
      const result = foodAddItem(item.restaurantId ?? "", item.restaurantName ?? "", line);
      trackBehavior({ type: "ADD_TO_CART", category: item.category, refType: "foodItem", refId: item.id });
      if (result.conflict && foodRestaurantName) {
        Alert.alert(
          "Start a new cart?",
          `Your food cart contains items from ${foodRestaurantName}. Adding this dish will clear that cart.`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Start New Cart", style: "destructive", onPress: () => foodReplace(item.restaurantId ?? "", item.restaurantName ?? "", line) },
          ],
        );
      }
    } else {
      storeAdd(storeProductRef({ id: item.id, service: item.service ?? "", name: item.name, imageUrl: item.imageUrl, price: item.price }));
      trackBehavior({ type: "ADD_TO_CART", category: item.category, refType: "product", refId: item.id });
    }
  }, [isFood, item, toCartLine, foodAddItem, foodRestaurantName, foodReplace, storeAdd]);

  const onInc = useCallback(() => {
    if (isFood) {
      const line = toCartLine();
      const result = foodAddItem(item.restaurantId ?? "", item.restaurantName ?? "", line);
      if (result.conflict && foodRestaurantName) {
        Alert.alert(
          "Start a new cart?",
          `Your food cart contains items from ${foodRestaurantName}. Adding this dish will clear that cart.`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Start New Cart", style: "destructive", onPress: () => foodReplace(item.restaurantId ?? "", item.restaurantName ?? "", line) },
          ],
        );
      }
    } else {
      storeAdd(storeProductRef({ id: item.id, service: item.service ?? "", name: item.name, imageUrl: item.imageUrl, price: item.price }));
    }
  }, [isFood, item, toCartLine, foodAddItem, foodRestaurantName, foodReplace, storeAdd]);

  const onDec = useCallback(() => {
    if (isFood) {
      const line = foodItems.find((i) => i.lineId === item.id);
      if (line) foodUpdateQty(line.lineId, -1);
    } else {
      const line = storeItems.find((i) => i.productId === item.id);
      if (line) storeUpdateQty(line.lineId, -1);
    }
  }, [isFood, item, foodItems, storeItems, foodUpdateQty, storeUpdateQty]);

  const qty = isFood ? foodQty : storeQty;
  const accent = item.category === "food" ? colors.primary : item.category === "grocery" || item.category === "vegetables" ? colors.success : colors.dark;

  return (
    <Pressable style={styles.card} accessibilityRole="button">
      <View>
        <RemoteImage uri={item.imageUrl} fallbackLabel={item.name} style={styles.cardImage} contentFit="cover" />
        {item.discountPercent > 0 ? (
          <View style={styles.discountPill}>
            <Text style={styles.discountText}>{item.discountPercent}% OFF</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>
          {item.name}
        </Text>
        {isFood && item.restaurantName ? (
          <Text style={styles.cardMeta} numberOfLines={1}>
            {item.restaurantName}
          </Text>
        ) : item.vendorName ? (
          <Text style={styles.cardMeta} numberOfLines={1}>
            {item.vendorName}
          </Text>
        ) : null}

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: accent }]}>₹{item.price}</Text>
          {item.originalPrice && item.originalPrice > item.price ? (
            <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
          ) : null}
        </View>

        {item.rating ? (
          <Text style={styles.rating}>
            ★ {item.rating.toFixed(1)} <Text style={styles.reason}>• {item.reason}</Text>
          </Text>
        ) : (
          <Text style={styles.reason} numberOfLines={1}>
            {item.reason}
          </Text>
        )}

        <View style={styles.actionRow}>
          {qty === 0 ? (
            <Pressable style={[styles.addBtn, { borderColor: accent }]} onPress={onAdd} hitSlop={4} accessibilityRole="button">
              <Text style={[styles.addBtnText, { color: accent }]}>+ ADD</Text>
            </Pressable>
          ) : (
            <View style={[styles.qtyRow, { borderColor: accent }]}>
              <Pressable onPress={onDec} hitSlop={8} accessibilityRole="button" style={styles.qtyBtn}>
                <Icon name="minus" size={15} color={accent} />
              </Pressable>
              <Text style={styles.qtyValue}>{qty}</Text>
              <Pressable onPress={onInc} hitSlop={8} accessibilityRole="button" style={styles.qtyBtn}>
                <Icon name="plus" size={15} color={accent} />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  hScroll: { gap: spacing.md, paddingHorizontal: spacing.lg },
  card: {
    width: 150,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  cardImage: { width: "100%", height: 92 },
  discountPill: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: colors.warningMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: { color: "#B45309", fontSize: 9, fontWeight: "800" },
  cardBody: { padding: spacing.sm, gap: 3 },
  cardName: { ...typography.bodyStrong, fontSize: 13, minHeight: 34 },
  cardMeta: { ...typography.caption, color: colors.muted, fontSize: 10 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  price: { fontSize: 15, fontWeight: "900" },
  originalPrice: { ...typography.caption, color: colors.muted, textDecorationLine: "line-through" },
  rating: { ...typography.caption, color: colors.success, fontWeight: "700", fontSize: 10 },
  reason: { ...typography.caption, fontSize: 9, color: colors.muted, fontWeight: "500" },
  actionRow: { marginTop: 4 },
  addBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  addBtnText: { fontSize: 11, fontWeight: "800", flexDirection: "row", alignItems: "center" },
  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  qtyBtn: { paddingHorizontal: 4, paddingVertical: 2 },
  qtyValue: { fontWeight: "800", fontSize: 13 },
});
