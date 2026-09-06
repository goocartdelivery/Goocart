import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";
import { Icon } from "@/components/Icon";
import { foodStatusBadge, serviceStatusBadge } from "@/orders/StatusBadge";
import { canCancelFood, foodEtaRemaining, isFoodOngoing, isServiceOngoing, orderStatusLabel } from "@/orders/orderStatus";
import { FoodOrder } from "@/types";
import { ServiceOrder } from "@/services/ServiceOrderService";

type FoodCardProps = {
  order: FoodOrder;
  onOpen: () => void;
  onTrack?: () => void;
  onReorder?: () => void;
};

type ServiceCardProps = {
  order: ServiceOrder;
  onOpen: () => void;
};

// ---------------------------------------------------------------------------
// Unified premium Order card. Food orders (restaurant) and Store/GoCart orders
// (grocery/vegetables/mart) render through the same card so the Orders list
// stays one coherent timeline, but with clearly differentiated accents:
//   - Food  -> existing orange/primary identity, restaurant terminology
//   - Store -> green/success identity, "GoCart Store" + product terminology
// Every piece of text is derived from backend order data — nothing is hardcoded.
// ---------------------------------------------------------------------------
export function OrderCard({ order, onOpen, onTrack, onReorder }: FoodCardProps) {
  const dateText = new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const timeText = new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  const ongoing = isFoodOngoing(order.status);
  const cancellable = canCancelFood(order.status);
  const eta = foodEtaRemaining(order);
  const accent = colors.primary;

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed, ongoing && styles.cardOngoing]}
    >
      {/* Accent top bar for live orders so active work stands out. */}
      {ongoing ? <View style={[styles.ongoingBar, { backgroundColor: accent }]} /> : null}

      <View style={styles.cardBody}>
        <View style={styles.row}>
          <View style={[styles.brandIcon, { backgroundColor: colors.primaryMuted }]}>
            <Icon name="food" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={typography.bodyStrong} numberOfLines={1}>
              {order.restaurantName}
            </Text>
            <Text style={typography.caption} numberOfLines={1}>
              FOOD · {order.restaurantArea || "Restaurant"}
            </Text>
          </View>
          {foodStatusBadge(order.status)}
        </View>

        <View style={styles.itemsBlock}>
          {order.items.slice(0, 2).map((item) => (
            <Text key={item.lineId} style={styles.itemLine} numberOfLines={1}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQty}> × {item.quantity}</Text>
            </Text>
          ))}
          {order.items.length > 2 ? <Text style={styles.moreLine}>+ {order.items.length - 2} more items</Text> : null}
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {dateText} · {timeText}
          </Text>
          <Text style={styles.meta}></Text>
        </View>

        {/* ETA shown only for genuinely live orders with a backend estimate. */}
        {ongoing && eta !== null ? (
          <View style={styles.etaRow}>
            <Icon name="time" size={13} color={colors.primary} />
            <Text style={styles.etaText}>
              Arriving in about {eta} min{order.status === "ON_THE_WAY" || order.status === "ARRIVED" ? " · out for delivery" : ""}
            </Text>
          </View>
        ) : null}

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{order.bill.total}</Text>
          </View>
          <View style={styles.actions}>
            {ongoing && onTrack ? (
              <CardButton label="Track Order" primary onPress={onTrack} />
            ) : (
              <CardButton label="View Order" onPress={onOpen} />
            )}
            {order.status === "DELIVERED" && onReorder ? <CardButton label="Reorder" primary onPress={onReorder} /> : null}
            {cancellable ? <CardButton label="Cancel" destructive onPress={onOpen} /> : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function ServiceOrderCard({ order, onOpen }: ServiceCardProps) {
  const dateText = new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const timeText = new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  const ongoing = isServiceOngoing(order.status);
  const details = (order.details ?? {}) as Record<string, unknown>;
  const items = Array.isArray(details.items) ? (details.items as { name?: string; quantity?: number }[]) : [];
  const services = Array.isArray(details.services) ? (details.services as string[]) : [];
  const serviceLabel = services.length ? services.join(" + ") : order.service;
  const accent = colors.success;
  const isRide = order.service === "Bike Taxi";
  const isParcel = order.service === "Parcel";

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed, ongoing && styles.cardOngoing]}
    >
      {ongoing ? <View style={[styles.ongoingBar, { backgroundColor: accent }]} /> : null}

      <View style={styles.cardBody}>
        <View style={styles.row}>
          <View style={[styles.brandIcon, { backgroundColor: colors.successMuted }]}>
            <Icon name={isRide ? "bike" : isParcel ? "parcel" : "grocery"} size={18} color={colors.success} />
          </View>
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={typography.bodyStrong} numberOfLines={1}>
              {isRide || isParcel ? order.service : order.vendorName || "GoCart Store"}
            </Text>
            <Text style={typography.caption} numberOfLines={1}>
              {isRide ? "BIKE TAXI" : isParcel ? "PARCEL" : `${serviceLabel} · GoCart Store`}
            </Text>
          </View>
          {serviceStatusBadge(order.status)}
        </View>

        <View style={styles.itemsBlock}>
          {items.length > 0 ? (
            <>
              {items.slice(0, 2).map((item, index) => (
                <Text key={`${item.name ?? "item"}-${index}`} style={styles.itemLine} numberOfLines={1}>
                  <Text style={styles.itemName}>{item.name ?? "Item"}</Text>
                  <Text style={styles.itemQty}> × {item.quantity ?? 1}</Text>
                </Text>
              ))}
              {items.length > 2 ? <Text style={styles.moreLine}>+ {items.length - 2} more items</Text> : null}
            </>
          ) : (
            <Text style={styles.itemLine} numberOfLines={1}>
              <Text style={styles.itemName}>{order.reference}</Text>
              {typeof details.distanceKm === "number" ? <Text style={styles.itemQty}> · {details.distanceKm} km</Text> : null}
            </Text>
          )}
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {dateText} · {timeText}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={[styles.totalValue, { color: accent }]}>₹{order.total}</Text>
          </View>
          <View style={styles.actions}>
            <CardButton label={ongoing ? "Track Order" : "View Order"} primary={ongoing} onPress={onOpen} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function CardButton({ label, onPress, primary, destructive }: { label: string; onPress: () => void; primary?: boolean; destructive?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.cardBtn, (primary || destructive) && styles.cardBtnPrimary, destructive && styles.cardBtnDestructive, pressed && styles.cardBtnPressed]}
    >
      <Text style={[styles.cardBtnText, (primary || destructive) && styles.cardBtnTextPrimary, destructive && styles.cardBtnTextDestructive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  cardPressed: { opacity: 0.92 },
  cardOngoing: { borderColor: colors.border },
  ongoingBar: { height: 3 },
  cardBody: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  brandIcon: { width: 38, height: 38, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  itemsBlock: { gap: 2, paddingLeft: spacing.md * 2 + 2 },
  itemLine: { ...typography.body, fontSize: 13 },
  itemName: { color: colors.text },
  itemQty: { color: colors.muted },
  moreLine: { ...typography.caption, color: colors.primary, marginTop: 2 },
  metaRow: { flexDirection: "row", paddingLeft: spacing.md * 2 + 2 },
  meta: { ...typography.caption, fontSize: 10 },
  etaRow: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.primaryMuted, paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radius.sm, alignSelf: "flex-start" },
  etaText: { ...typography.captionStrong, color: colors.primary, fontSize: 11 },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: spacing.md },
  totalLabel: { ...typography.caption, fontSize: 10 },
  totalValue: { ...typography.h2, fontWeight: "800" },
  actions: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap", justifyContent: "flex-end" },
  cardBtn: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBtnPrimary: { borderColor: colors.primary, backgroundColor: colors.primary },
  cardBtnDestructive: { borderColor: colors.error, backgroundColor: colors.surface },
  cardBtnPressed: { opacity: 0.85 },
  cardBtnText: { ...typography.captionStrong, color: colors.text },
  cardBtnTextPrimary: { color: colors.white },
  cardBtnTextDestructive: { color: colors.error },
});

// Re-export the combined helper used by list screens.
export type OrderKind = { type: "food"; order: FoodOrder } | { type: "store" | "ride" | "parcel"; order: ServiceOrder };

export function kindIsOngoing(kind: OrderKind): boolean {
  return kind.type === "food" ? isFoodOngoing((kind.order as FoodOrder).status) : isServiceOngoing((kind.order as ServiceOrder).status);
}

export function kindStatusLabel(kind: OrderKind): string {
  return kind.type === "food" ? orderStatusLabel((kind.order as FoodOrder).status) : orderStatusLabel((kind.order as ServiceOrder).status);
}

export function isRideOrParcelService(service: string): boolean {
  return service === "Bike Taxi" || service === "Parcel";
}
