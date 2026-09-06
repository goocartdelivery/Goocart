import { StyleSheet, Text, View } from "react-native";
import { useClock } from "@/orders/useClock";
import { partnerSearchRemainingSeconds } from "@/orders/orderStatus";
import { colors, radius, spacing, typography } from "@/theme";
import { Icon } from "@/components/Icon";
import { FoodOrder } from "@/types";

// The dominant live status for an order waiting on a delivery partner. Shows a
// live countdown to the server-side auto-cancel deadline so the customer knows
// the platform is actively searching and how long it will wait before giving up.
export function FindingPartnerCard({ order }: { order: FoodOrder }) {
  const now = useClock(1000);
  const remaining = partnerSearchRemainingSeconds(order, now);

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Icon name="bike" size={22} color={colors.primary} />
        <View style={styles.pulse} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.title}>Finding a delivery partner…</Text>
        <Text style={styles.sub}>{"We're looking for a rider near "}{order.restaurantName}{" to pick up your order."}</Text>
      </View>
      {remaining !== null ? (
        <View style={styles.countdown}>
          <Icon name="time" size={14} color={remaining <= 60 ? colors.error : colors.muted} />
          <Text style={[styles.countdownText, remaining <= 60 && styles.countdownUrgent]}>
            {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  iconWrap: { position: "relative" },
  pulse: {
    position: "absolute",
    right: -2,
    top: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  title: { ...typography.bodyStrong, fontSize: 15 },
  sub: { ...typography.caption, color: colors.muted, lineHeight: 16 },
  countdown: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.sm },
  countdownText: { ...typography.bodyStrong, fontVariant: ["tabular-nums"], color: colors.muted },
  countdownUrgent: { color: colors.error },
});
