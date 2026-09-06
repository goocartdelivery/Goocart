import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";
import { Icon } from "@/components/Icon";
import { MonogramTile, OrderItemLine, Hairline } from "@/orders/OrderFragments";
import { useClock } from "@/orders/useClock";
import { FOOD_STEPPER, STORE_STEPPER, foodEtaRemaining, orderStatusLabel, SERVICE_ETA_UNAVAILABLE } from "@/orders/orderStatus";
import { ActiveOrder } from "@/orders/useActiveOrders";
import { FoodOrder } from "@/types";

type Props = {
  entry: ActiveOrder;
  onOpen: () => void;
  onTrack: () => void;
};

// The single dominant active-order module on the Orders screen. One tasteful
// surface with internal hairlines (not a stack of cards) so the live order
// reads as the visual hero. Every word is backend-derived; ETA only appears
// when the backend provides an estimate.
export function ActiveOrderHero({ entry, onOpen, onTrack }: Props) {
  const isFood = entry.kind === "food";
  const order = entry.order;
  const brand = isFood ? (order as FoodOrder).restaurantName : (order as ServiceOrder).vendorName || (order as ServiceOrder).service;
  const stepper = isFood ? FOOD_STEPPER : STORE_STEPPER;
  const currentIndex = Math.max(0, stepper.indexOf(order.status));
  const progress = Math.min(1, currentIndex / (stepper.length - 1));
  const accent = isFood ? colors.primary : colors.success;
  const now = useClock(30000);

  const placedText = () => {
    const d = new Date(order.createdAt);
    const mins = Math.max(1, Math.round((now - d.getTime()) / 60000));
    return mins < 60 ? `Placed ${mins} min ago` : d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  };

  const eta = isFood ? foodEtaRemaining(order as FoodOrder) : null;
  const etaText = isFood && eta !== null && eta > 0 ? `Arriving in about ${eta} min` : SERVICE_ETA_UNAVAILABLE;

  const items = isFood
    ? (order as FoodOrder).items
    : (() => {
        const details = ((order as ServiceOrder).details ?? {}) as Record<string, unknown>;
        const list = Array.isArray(details.items) ? (details.items as { name?: string; quantity?: number; price?: number }[]) : [];
        return list.map((it, i) => ({ lineId: `${order.id}-${i}`, name: it.name ?? "Item", quantity: it.quantity ?? 1, lineTotal: it.price ?? 0 }));
      })();

  const total = isFood ? (order as FoodOrder).bill.total : (order as ServiceOrder).total;

  return (
    <Pressable accessibilityRole="button" onPress={onOpen} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {/* Header */}
      <View style={styles.header}>
        <MonogramTile label={brand} size={46} color={accent} radiusValue={radius.md} />
        <View style={{ flex: 1, gap: 1 }}>
          <View style={styles.brandRow}>
            <Text style={styles.brand} numberOfLines={1}>
              {brand}
            </Text>
            <View style={styles.liveDotWrap}>
              <View style={[styles.liveDot, { backgroundColor: accent }]} />
            </View>
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {isFood ? `Order #${(order as FoodOrder).orderNumber}` : `Ref ${(order as ServiceOrder).reference}`} · {placedText()}
          </Text>
        </View>
      </View>

      <Hairline style={{ marginVertical: spacing.md }} />

      {/* Status + realtime ETA */}
      <Text style={styles.statusLine}>{orderStatusLabel(order.status)}</Text>
      <Text style={styles.eta}>{etaText}</Text>

      {/* Thin index-driven progress line */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { backgroundColor: accent, width: `${progress * 100}%` }]} />
      </View>

      <Hairline style={{ marginVertical: spacing.md }} />

      {/* Compact item lines */}
      <View style={{ gap: spacing.sm }}>
        {items.slice(0, 2).map((item) => (
          <OrderItemLine key={item.lineId} name={item.name} quantity={item.quantity} price={item.lineTotal} />
        ))}
        {items.length > 2 ? <Text style={styles.more}>+ {items.length - 2} more items</Text> : null}
      </View>

      <Hairline style={{ marginVertical: spacing.md }} />

      {/* Footer: total + track CTA */}
      <View style={styles.footer}>
        <View style={{ gap: 1 }}>
          <Text style={styles.totalLabel}>Order total</Text>
          <Text style={styles.totalValue}>₹{total}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onTrack} style={({ pressed }) => [styles.trackBtn, pressed && styles.pressed]}>
          <Text style={[styles.trackText, { color: accent }]}>Track Order</Text>
          <Icon name="forward" size={15} color={accent} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  pressed: { opacity: 0.94 },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  brand: { ...typography.h3 },
  liveDotWrap: { width: 7, height: 7 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  meta: { ...typography.caption, color: colors.muted },
  statusLine: { ...typography.h2 },
  eta: { ...typography.body, color: colors.primary, marginTop: 2 },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: "hidden", marginTop: spacing.md },
  progressFill: { height: 4, borderRadius: 2 },
  more: { ...typography.caption, color: colors.primary, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { ...typography.caption, fontSize: 10 },
  totalValue: { ...typography.h2, fontWeight: "800" },
  trackBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  trackText: { ...typography.captionStrong, fontWeight: "800", fontSize: 13 },
});
