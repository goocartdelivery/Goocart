import { Pressable, StyleSheet, Text, View } from "react-native";
import { RemoteImage } from "@/components/RemoteImage";
import { Icon } from "@/components/Icon";
import { ServiceProduct } from "@/services/ServiceOrderService";
import { colors, radius, spacing, typography } from "@/theme";

type Props = {
  product: ServiceProduct;
  cardWidth: number;
  qty: number;
  onInc: () => void;
  onDec: () => void;
  accent?: string;
};

const DEFAULT_ACCENT = "#16A34A";

export function GroceryProductCard({ product, cardWidth, qty, onInc, onDec, accent = DEFAULT_ACCENT }: Props) {
  const desc = product.description || product.eta || "";
  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <View style={styles.imageWrap}>
        <RemoteImage uri={product.imageUrl} fallbackLabel={product.name} style={styles.image} contentFit="cover" />
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        {desc ? (
          <Text style={styles.desc} numberOfLines={1}>
            {desc}
          </Text>
        ) : null}
        <View style={styles.bottomRow}>
          <Text style={[styles.price, { color: accent }]}>₹{product.price}</Text>
          <View style={styles.actionSlot}>
            {qty === 0 ? (
              <Pressable
                onPress={onInc}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={`Add ${product.name} to cart`}
                style={[styles.addBtn, { borderColor: accent }]}
              >
                <Text style={[styles.addText, { color: accent }]}>ADD</Text>
              </Pressable>
            ) : (
              <View style={[styles.stepper, { borderColor: accent }]}>
                <Pressable onPress={onDec} hitSlop={8} accessibilityRole="button" style={styles.stepBtn} accessibilityLabel={`Decrease ${product.name}`}>
                  <Icon name="minus" size={14} color={accent} />
                </Pressable>
                <Text style={styles.qty}>{qty}</Text>
                <Pressable onPress={onInc} hitSlop={8} accessibilityRole="button" style={styles.stepBtn} accessibilityLabel={`Increase ${product.name}`}>
                  <Icon name="plus" size={14} color={accent} />
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: "hidden",
    flexShrink: 0,
  },
  imageWrap: { width: "100%", aspectRatio: 1.15, backgroundColor: colors.background },
  image: { width: "100%", height: "100%" },
  body: { padding: spacing.sm, gap: 2 },
  name: { ...typography.bodyStrong, fontSize: 12.5, lineHeight: 16 },
  desc: { ...typography.caption, fontSize: 10.5, color: colors.muted },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  price: { fontSize: 15, fontWeight: "800" },
  actionSlot: { height: 26, alignItems: "center", justifyContent: "center" },
  addBtn: {
    borderWidth: 1.25,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.sm,
    minWidth: 50,
    alignItems: "center",
    justifyContent: "center",
    height: 26,
  },
  addText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.2 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderWidth: 1.25,
    borderRadius: radius.sm,
    paddingHorizontal: 2,
    height: 26,
  },
  stepBtn: { width: 22, height: 22, alignItems: "center", justifyContent: "center" },
  qty: { minWidth: 14, textAlign: "center", fontSize: 12, fontWeight: "800", color: colors.dark },
});
