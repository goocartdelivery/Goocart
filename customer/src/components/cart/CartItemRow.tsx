import { Pressable, StyleSheet, Text, View } from "react-native";
import { CartLineItem } from "@/types";
import { colors, radius, spacing, typography } from "@/theme";
import { QuantityStepper } from "@/components/QuantityStepper";
import { VegBadge } from "@/components/VegBadge";
import { RemoteImage } from "@/components/RemoteImage";
import { Icon } from "@/components/Icon";

type Props = {
  item: CartLineItem;
  onChangeQty: (delta: number) => void;
  onRemove: () => void;
};

export function CartItemRow({ item, onChangeQty, onRemove }: Props) {
  const hasCustomisation = Boolean(item.selectedVariant || item.selectedAddons.length);
  return (
    <View style={styles.row}>
      <RemoteImage uri={item.imageUrl} fallbackLabel={item.name} style={styles.photo} />
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <VegBadge veg={item.veg} />
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
        </View>

        {hasCustomisation ? (
          <View style={styles.customWrap}>
            {item.selectedVariant ? <Text style={styles.customText}>• {item.selectedVariant.name}</Text> : null}
            {item.selectedAddons.map((a) => (
              <Text key={a.id} style={styles.customText}>
                • {a.name}
              </Text>
            ))}
          </View>
        ) : null}

        <Text style={styles.unitPrice}>₹{item.unitPrice}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.name}`} onPress={onRemove} style={styles.removeBtn} hitSlop={8}>
          <Icon name="close" size={16} color={colors.muted} />
        </Pressable>
        <View style={styles.qtyWrap}>
          <QuantityStepper small value={item.quantity} onIncrement={() => onChangeQty(1)} onDecrement={() => onChangeQty(-1)} />
        </View>
        <Text style={styles.lineTotal}>₹{item.lineTotal}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  photo: { width: 64, height: 64, borderRadius: radius.md },
  info: { flex: 1, gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  name: { ...typography.bodyStrong, flex: 1 },
  customWrap: { gap: 2, marginTop: 2 },
  customText: { ...typography.caption, fontSize: 11 },
  unitPrice: { ...typography.caption, fontWeight: "700", marginTop: 2 },
  actions: { alignItems: "flex-end", gap: spacing.sm },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  qtyWrap: {},
  lineTotal: { ...typography.bodyStrong },
});
