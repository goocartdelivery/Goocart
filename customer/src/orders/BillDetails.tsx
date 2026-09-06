import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/theme";

type BillSource = {
  itemTotal: number;
  restaurantDiscount?: number;
  couponDiscount?: number;
  deliveryFee?: number;
  platformFee?: number;
  taxes?: number;
  tip?: number;
  total: number;
};

// Renders a backend-provided bill breakdown. It NEVER re-prices or recalculates
// anything — the numbers shown are exactly what the order response carried for
// this order (historical amounts stay historical on completed orders).
export function BillDetails({ bill }: { bill: BillSource }) {
  const discounts = (bill.restaurantDiscount ?? 0) + (bill.couponDiscount ?? 0);
  const lines: { label: string; value: number; kind?: "discount" | "fee" }[] = [];

  lines.push({ label: "Item Total", value: bill.itemTotal });
  if (bill.restaurantDiscount && bill.restaurantDiscount > 0) lines.push({ label: "Restaurant Discount", value: -bill.restaurantDiscount, kind: "discount" });
  if (bill.couponDiscount && bill.couponDiscount > 0) lines.push({ label: "Coupon Discount", value: -bill.couponDiscount, kind: "discount" });
  if (bill.deliveryFee) lines.push({ label: "Delivery Fee", value: bill.deliveryFee, kind: "fee" });
  if (bill.platformFee) lines.push({ label: "Platform Fee", value: bill.platformFee, kind: "fee" });
  if (bill.taxes) lines.push({ label: "Taxes", value: bill.taxes, kind: "fee" });
  if (bill.tip && bill.tip > 0) lines.push({ label: "Tip", value: bill.tip, kind: "fee" });

  return (
    <View style={styles.wrap}>
      {lines.map((line) => (
        <View key={line.label} style={styles.row}>
          <Text style={line.kind === "discount" ? styles.discountLabel : styles.label}>{line.label}</Text>
          <Text style={[styles.value, line.kind === "discount" ? styles.discountValue : null]}>
            {line.value < 0 ? "-" : ""}₹{Math.abs(line.value)}
          </Text>
        </View>
      ))}
      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.totalLabel}>To Pay</Text>
        <Text style={styles.totalValue}>₹{bill.total}</Text>
      </View>
      {discounts > 0 ? (
        <Text style={styles.saved}>You saved ₹{discounts} on this order</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { ...typography.body },
  discountLabel: { ...typography.body, color: colors.success },
  value: { ...typography.body },
  discountValue: { ...typography.bodyStrong, color: colors.success },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  totalLabel: { ...typography.bodyStrong },
  totalValue: { ...typography.h3, fontWeight: "800" },
  saved: { ...typography.caption, color: colors.success, marginTop: spacing.xs, fontWeight: "700" },
});
