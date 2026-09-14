import { Pressable, StyleSheet, Text, View } from "react-native";
import { StoreCartBill, StoreCartLineItem } from "@/types";
import { colors, radius, spacing, typography } from "@/theme";
import { QuantityStepper } from "@/components/QuantityStepper";
import { RemoteImage } from "@/components/RemoteImage";
import { Icon } from "@/components/Icon";

const SERVICE_LABEL: Record<StoreCartLineItem["service"], string> = {
  GROCERY: "Grocery",
  VEGETABLES: "Veg",
  MART: "Mart",
  MEDICINE: "Medicine",
};

const SERVICE_COLOR: Record<StoreCartLineItem["service"], string> = {
  GROCERY: "#B45309",
  VEGETABLES: colors.success,
  MART: "#0369A1",
  MEDICINE: "#0E9F6E",
};

type Props = {
  items: StoreCartLineItem[];
  bill: StoreCartBill;
  onInc: (lineId: string) => void;
  onDec: (lineId: string) => void;
  onRemove: (lineId: string) => void;
  onClear: () => void;
  onCheckout: () => void;
};

export function StoreCartSection({ items, bill, onInc, onDec, onRemove, onClear, onCheckout }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.eyebrow}>GO CART STORE</Text>
          <Text style={styles.title}>Store Cart</Text>
        </View>
        <Pressable onPress={onClear} style={styles.clearBtn} hitSlop={8}>
          <Icon name="close" size={16} color={colors.muted} />
        </Pressable>
      </View>

      <View style={styles.chips}>
        {(["GROCERY", "VEGETABLES", "MART", "MEDICINE"] as const).map((s) => {
          const count = items.filter((i) => i.service === s).reduce((sum, i) => sum + i.quantity, 0);
          if (count === 0) return null;
          return (
            <View key={s} style={[styles.chip, { backgroundColor: SERVICE_COLOR[s] }]}>
              <Text style={styles.chipText}>{SERVICE_LABEL[s]} · {count}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.items}>
        {items.map((item) => (
          <View key={item.lineId} style={styles.itemRow}>
            <RemoteImage uri={item.imageUrl} fallbackLabel={item.name} style={styles.photo} />
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={[styles.serviceDot, { color: SERVICE_COLOR[item.service] }]}>●</Text>
                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
              </View>
              <Text style={styles.serviceTag}>{SERVICE_LABEL[item.service]}</Text>
              {item.prescriptionRequired ? (
                <View style={styles.rxBadge}>
                  <Text style={styles.rxText}>Rx · PRESCRIPTION REQUIRED</Text>
                </View>
              ) : null}
              <Text style={styles.unitPrice}>₹{item.unitPrice}</Text>
            </View>
            <View style={styles.actions}>
              <Pressable onPress={() => onRemove(item.lineId)} style={styles.removeBtn} hitSlop={8}>
                <Icon name="close" size={14} color={colors.muted} />
              </Pressable>
              <QuantityStepper small value={item.quantity} onIncrement={() => onInc(item.lineId)} onDecrement={() => onDec(item.lineId)} />
              <Text style={styles.lineTotal}>₹{item.lineTotal}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.bill}>
        <Row label="Item Total" value={bill.itemTotal} />
        {bill.couponDiscount > 0 ? <Row label="Discount" value={bill.couponDiscount} highlight /> : null}
        <Row label="Delivery Fee" value={bill.deliveryFee} />
        <Row label="Platform Fee" value={bill.platformFee} />
        <Row label="Taxes" value={bill.taxes} />
        {bill.tip > 0 ? <Row label="Tip" value={bill.tip} /> : null}
        <View style={styles.thinDivider} />
        <Row label="To Pay" value={bill.total} strong />
        {bill.couponDiscount > 0 ? <Text style={styles.saved}>You saved ₹{bill.couponDiscount} on this order</Text> : null}
      </View>

      <Pressable accessibilityRole="button" onPress={onCheckout} style={({ pressed }) => [styles.checkoutBtn, pressed && styles.pressed]}>
        <Text style={styles.checkoutText}>Proceed to Store Checkout · ₹{bill.total}</Text>
      </Pressable>
    </View>
  );
}

function Row({ label, value, strong, highlight }: { label: string; value: number; strong?: boolean; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={strong ? typography.bodyStrong : typography.body}>{label}</Text>
      <Text style={[strong ? typography.bodyStrong : typography.body, highlight && { color: colors.success }]}>₹{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  titleWrap: { flex: 1 },
  eyebrow: { ...typography.eyebrow, fontSize: 10, color: colors.success },
  title: { ...typography.h2, marginTop: 2 },
  clearBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
  chipText: { ...typography.captionStrong, color: colors.white, fontSize: 11 },
  items: { gap: 0 },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  photo: { width: 56, height: 56, borderRadius: radius.md },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  serviceDot: { fontSize: 8 },
  name: { ...typography.bodyStrong, flex: 1 },
  serviceTag: { ...typography.caption, fontSize: 10 },
  rxBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#D1FAE5",
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginTop: 2,
  },
  rxText: { fontSize: 9, fontWeight: "800", color: "#0E9F6E", letterSpacing: 0.2 },
  unitPrice: { ...typography.caption, fontWeight: "700", marginTop: 2 },
  actions: { alignItems: "flex-end", gap: spacing.sm },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  lineTotal: { ...typography.bodyStrong },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.xs },
  bill: { gap: spacing.sm },
  thinDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.xs },
  checkoutBtn: {
    backgroundColor: colors.success,
    borderRadius: radius.md,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  pressed: { opacity: 0.9 },
  checkoutText: { ...typography.button, fontSize: 14 },
  saved: { ...typography.caption, color: colors.success, fontWeight: "600", textAlign: "right" },
});
