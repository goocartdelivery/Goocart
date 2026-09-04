import { useEffect, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { FoodItem } from "@/types";
import { colors, radius, spacing, typography } from "@/theme";
import { VegBadge } from "@/components/VegBadge";
import { RemoteImage } from "@/components/RemoteImage";
import { Icon } from "@/components/Icon";

type Props = {
  item: FoodItem;
  quantityInCart: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
};

// Premium food item card. Displays backend fields only (image, name,
// description, veg, bestseller, rating, price, availability). The ADD button
// smoothly morphs into a − 1 + stepper once the item is in cart.
export function FoodItemCard({ item, quantityInCart, onAdd, onIncrement, onDecrement }: Props) {
  const hasChoices = Boolean(item.variants?.length || item.addonGroups?.length);
  const inCart = quantityInCart > 0;

  // Stable Animated.Value (initialised once) drives the ADD -> stepper swap.
  const [added] = useState(() => new Animated.Value(inCart ? 1 : 0));
  useEffect(() => {
    Animated.timing(added, { toValue: inCart ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  }, [inCart, added]);

  const addOpacity = added.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const stepOpacity = added;

  return (
    <View style={[styles.card, !item.available && styles.cardUnavailable]}>
      <View style={styles.info}>
        <View style={styles.badgeRow}>
          <VegBadge veg={item.veg} />
          {item.bestseller ? (
            <View style={styles.bestsellerPill}>
              <Text style={styles.bestsellerText}>★ BESTSELLER</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.name}>{item.name}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{item.price}</Text>
          {item.rating ? (
            <>
              <Text style={styles.divider}>·</Text>
              <Text style={styles.rating}>
                ★ {item.rating.toFixed(1)}
                {item.ratingCount ? ` (${formatCount(item.ratingCount)})` : ""}
              </Text>
            </>
          ) : null}
        </View>

        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>

      <View style={styles.actionCol}>
        <RemoteImage uri={item.imageUrl} fallbackLabel={item.name} style={styles.photo} />

        {!item.available ? (
          <View style={styles.soldOutBtn}>
            <Text style={styles.soldOutText}>SOLD OUT</Text>
          </View>
        ) : (
          <View style={styles.controlWrap}>
            <Animated.View style={[styles.control, { opacity: addOpacity }]} pointerEvents={inCart ? "none" : "auto"}>
              <Pressable onPress={onAdd} style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}>
                <Text style={styles.addBtnText}>ADD</Text>
              </Pressable>
            </Animated.View>
            <Animated.View style={[styles.stepper, { opacity: stepOpacity }]} pointerEvents={inCart ? "auto" : "none"}>
              <Pressable onPress={onDecrement} hitSlop={8} style={styles.stepBtn}>
                <Icon name="minus" size={16} color={colors.primary} />
              </Pressable>
              <Text style={styles.stepValue}>{quantityInCart}</Text>
              <Pressable onPress={onIncrement} hitSlop={8} style={styles.stepBtn}>
                <Icon name="plus" size={16} color={colors.primary} />
              </Pressable>
            </Animated.View>
          </View>
        )}

        {item.available && hasChoices ? <Text style={styles.customisable}>customisable</Text> : null}
      </View>
    </View>
  );
}

function formatCount(count: number): string {
  return count >= 1000 ? `${(count / 1000).toFixed(1)}K` : String(count);
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", gap: spacing.lg, paddingVertical: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
  cardUnavailable: { opacity: 0.55 },
  info: { flex: 1, gap: 5 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  bestsellerPill: { backgroundColor: colors.warningMuted, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  bestsellerText: { color: "#B45309", fontSize: 9, fontWeight: "800", letterSpacing: 0.3 },
  name: { ...typography.h3, fontSize: 16 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  price: { ...typography.bodyStrong, fontSize: 15 },
  divider: { color: colors.border },
  rating: { ...typography.caption, color: colors.success, fontWeight: "700" },
  description: { ...typography.caption, lineHeight: 17, marginTop: 2 },
  actionCol: { width: 116, alignItems: "center" },
  photo: { width: 116, height: 96, borderRadius: radius.md },
  controlWrap: { width: 116, height: 34, marginTop: -18, alignItems: "center" },
  control: { position: "absolute", width: "100%", alignItems: "center" },
  addBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
    minWidth: 96,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  pressed: { opacity: 0.75 },
  addBtnText: { color: colors.primary, fontWeight: "900", fontSize: 12, letterSpacing: 0.5 },
  stepper: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: 104,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xs,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  stepBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  stepValue: { color: colors.primary, fontWeight: "800", fontSize: 14, minWidth: 16, textAlign: "center" },
  soldOutBtn: {
    marginTop: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
    minWidth: 96,
    alignItems: "center",
  },
  soldOutText: { color: colors.muted, fontWeight: "700", fontSize: 12, letterSpacing: 0.5 },
  customisable: { ...typography.caption, fontSize: 9, marginTop: 4 },
});
