import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, typography } from "@/theme";

type Props = {
  itemCount: number;
  total: number;
  savings?: number;
  onPress: () => void;
};

export function CheckoutBar({ itemCount, total, savings = 0, onPress }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.safe, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
      >
        <View>
          <Text style={styles.count}>
            {itemCount} item{itemCount > 1 ? "s" : ""} • ₹{total}
          </Text>
          <Text style={styles.total}>To Pay · ₹{total}</Text>
        </View>
        <View style={styles.cta}>
          <Text style={styles.ctaText}>Proceed to Checkout</Text>
        </View>
      </Pressable>
      {savings > 0 ? (
        <Text style={styles.savings}>You saved ₹{savings} including coupons & offers</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  pressed: { opacity: 0.9 },
  count: { ...typography.captionStrong, fontSize: 12 },
  total: { ...typography.h2 },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minWidth: 190,
    alignItems: "center",
  },
  ctaText: { ...typography.button, fontSize: 14 },
  savings: { ...typography.caption, textAlign: "center", color: colors.success },
});
