import { StyleSheet, Text, View } from "react-native";
import { BillBreakdown } from "@/types";
import { colors, radius, spacing, typography } from "@/theme";
import { Icon } from "@/components/Icon";

type Props = {
  bill: BillBreakdown;
  couponCode: string | null;
};

function Row({ label, value, strong, highlight }: { label: string; value: number; strong?: boolean; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={strong ? typography.bodyStrong : typography.body}>{label}</Text>
      <Text style={[strong ? typography.bodyStrong : typography.body, highlight && { color: colors.success }]}>
        {value < 0 ? "-" : ""}₹{Math.abs(value)}
      </Text>
    </View>
  );
}

export function BillSummary({ bill, couponCode }: Props) {
  const savings = bill.restaurantDiscount + bill.couponDiscount;
  return (
    <View style={styles.card}>
      <Text style={typography.h3}>Bill Details</Text>

      {savings > 0 ? (
        <View style={styles.savings}>
          <View style={styles.savingsIcon}>
            <Icon name="crown" size={16} color="#B45309" />
          </View>
          <Text style={styles.savingsText}>
            You saved ₹{savings} on this order
          </Text>
        </View>
      ) : null}

      <View style={styles.rows}>
        <Row label="Item Total" value={bill.itemTotal} />
        {bill.restaurantDiscount > 0 ? <Row label="Restaurant Discount" value={-bill.restaurantDiscount} highlight /> : null}
        {bill.couponDiscount > 0 ? <Row label={`Coupon${couponCode ? ` (${couponCode})` : ""} Discount`} value={-bill.couponDiscount} highlight /> : null}
        <Row label="Delivery Fee" value={bill.deliveryFee} />
        <Row label="Platform Fee" value={bill.platformFee} />
        <Row label="Taxes" value={bill.taxes} />
        {bill.tip > 0 ? <Row label="Tip" value={bill.tip} /> : null}
        <View style={styles.divider} />
        <Row label="To Pay" value={bill.total} strong />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  savings: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.warningMuted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  savingsIcon: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    backgroundColor: colors.warning,
    alignItems: "center",
    justifyContent: "center",
  },
  savingsText: { ...typography.bodyStrong, color: "#B45309", flex: 1 },
  rows: { gap: spacing.sm },
  row: { flexDirection: "row", justifyContent: "space-between" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.xs },
});
