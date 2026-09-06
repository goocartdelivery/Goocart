import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";
import { Icon } from "@/components/Icon";

type Props = {
  // The amount that counts toward unlocking free delivery (the cart's subtotal).
  qualifyingTotal: number;
  // deliveryFee is what the user avoids by unlocking (from live pricing settings).
  deliveryFee: number;
  freeDeliveryCoupon: { code: string; minOrder: number } | null;
  // "Unlocked" means the cart currently qualifies for free delivery (decided
  // by the same eligibility engine the bill uses) — NOT that it's applied.
  unlocked: boolean;
  // "Effective" means free delivery is actually applied and the delivery fee is
  // ₹0 in the bill. Kept separate from "unlocked" so the bar never claims the
  // fee is waived before the code is actually on the order.
  effective: boolean;
  onApply: () => void;
  onSkip: () => void;
};

// Smart savings bar. The unlock target is the FREE_DELIVERY coupon's min-order
// from the live catalog, so this is always driven by real order rules — never
// a hardcoded "order ₹X more" figure. "Unlocked" is decided by the caller from
// the same coupon data the bill uses, so it can never agree to zero the
// delivery fee while the bill still charges it.
export function FreeDeliveryProgress({ qualifyingTotal, deliveryFee, freeDeliveryCoupon, unlocked, effective, onApply, onSkip }: Props) {
  const target = freeDeliveryCoupon ? freeDeliveryCoupon.minOrder : 0;
  const remaining = Math.max(0, target - qualifyingTotal);
  const pct = target > 0 ? Math.min(100, Math.round((qualifyingTotal / target) * 100)) : 0;

  if (!freeDeliveryCoupon || target <= 0) return null;

  const sub = effective
    ? `Free delivery applied — saving ₹${deliveryFee}`
    : unlocked
      ? `Use code ${freeDeliveryCoupon.code} to get FREE delivery`
      : "Hitting the threshold unlocks a ₹0 delivery fee";

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.icon, (unlocked || effective) && styles.iconUnlocked]}>
          <Icon name="bolt" size={18} color={unlocked || effective ? colors.white : colors.dark} />
        </View>
        <View style={styles.copyWrap}>
          {unlocked || effective ? (
            <Text style={styles.titleUnlocked}>FREE Delivery unlocked 🎉</Text>
          ) : (
            <Text style={styles.title}>
              Add <Text style={styles.amount}>₹{remaining}</Text> more to unlock FREE Delivery
            </Text>
          )}
          <Text style={styles.sub}>{sub}</Text>
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }, (unlocked || effective) && styles.fillUnlocked]} />
      </View>

      {effective ? null : (
        <View style={styles.footer}>
          <Pressable accessibilityRole="button" disabled={!freeDeliveryCoupon} onPress={onApply} style={({ pressed }) => [styles.applyBtn, pressed && styles.pressed]}>
            <Text style={styles.applyText}>{unlocked ? `Apply ${freeDeliveryCoupon.code}` : `Apply ${freeDeliveryCoupon.code}`}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onSkip} hitSlop={8}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#FFCBA8",
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.warning,
    alignItems: "center",
    justifyContent: "center",
  },
  iconUnlocked: { backgroundColor: colors.success },
  copyWrap: { flex: 1, gap: 2 },
  title: { ...typography.bodyStrong },
  titleUnlocked: { ...typography.bodyStrong, color: colors.success },
  amount: { color: colors.primary },
  sub: { ...typography.caption, fontSize: 12 },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.7)",
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: radius.pill, backgroundColor: colors.primary },
  fillUnlocked: { backgroundColor: colors.success },
  footer: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  applyBtn: {
    backgroundColor: colors.dark,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
  },
  pressed: { opacity: 0.85 },
  applyText: { ...typography.captionStrong, color: colors.white },
  skipText: { ...typography.captionStrong, color: colors.muted },
});
