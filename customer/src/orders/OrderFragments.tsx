import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

// ---------------------------------------------------------------------------
// Shared editorial primitives for the Orders surface. The whole section uses a
// restrained, typographic system: section headings + hairline dividers + simple
// monogram anchors instead of stacked rounded cards and decorative icons.
// ---------------------------------------------------------------------------

// Small uppercase section heading used to group a block of content.
export function OrdersSectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

// A 1px hairline divider for editorial separation.
export function Hairline({ style }: { style?: object }) {
  return <View style={[styles.hairline, style]} />;
}

// Branded monogram tile used as the primary image anchor when no photo exists on
// an order (list rows + hero). A deliberate, production-typical pattern.
export function MonogramTile({
  label,
  size = 44,
  color = colors.primary,
  radiusValue = radius.md,
}: {
  label: string;
  size?: number;
  color?: string;
  radiusValue?: number;
}) {
  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: radiusValue, backgroundColor: `${color}18` }]}>
      <Text style={[styles.tileText, { color, fontSize: size * 0.38 }]}>{label.trim().slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

// One compact order-item line: leading name, trailing price, secondary details.
export function OrderItemLine({
  name,
  quantity,
  price,
  detail,
}: {
  name: string;
  quantity: number;
  price: number;
  detail?: string;
}) {
  return (
    <View style={styles.itemLine}>
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={styles.itemName} numberOfLines={1}>
          {name}
          <Text style={styles.itemQty}> × {quantity}</Text>
        </Text>
        {detail ? (
          <Text style={styles.itemDetail} numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
      </View>
      <Text style={styles.itemPrice}>₹{price}</Text>
    </View>
  );
}

// "Label ... right-aligned value" row for metadata (bill, infos).
export function MoneyRow({ label, value, strong, emphasis }: { label: string; value: string; strong?: boolean; emphasis?: boolean }) {
  return (
    <View style={styles.moneyRow}>
      <Text style={emphasis ? styles.moneyLabelEmph : styles.moneyLabel}>{label}</Text>
      <Text style={[strong ? styles.moneyValueStrong : styles.moneyValue, emphasis && { color: colors.primary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    ...typography.captionStrong,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.muted,
  },
  hairline: { height: 1, backgroundColor: colors.border },
  tile: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  tileText: { fontWeight: "800" },
  itemLine: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  itemName: { ...typography.body, color: colors.text },
  itemQty: { color: colors.muted, fontSize: 12 },
  itemDetail: { ...typography.caption, color: colors.muted },
  itemPrice: { ...typography.bodyStrong },
  moneyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 3 },
  moneyLabel: { ...typography.body, color: colors.text },
  moneyLabelEmph: { ...typography.body, color: colors.primary },
  moneyValue: { ...typography.body, color: colors.text },
  moneyValueStrong: { ...typography.bodyStrong },
});
