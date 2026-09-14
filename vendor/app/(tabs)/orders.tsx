import { useEffect, useState } from "react";
import { Alert, RefreshControl, SectionList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { EmptyState } from "@/components/EmptyState";
<<<<<<< HEAD
import { OrderCard } from "@/components/OrderCard";
import { SkeletonOrderCard } from "@/components/SkeletonLoader";
import { colors, radius, spacing, typography } from "@/theme";
import { useOrdersStore } from "@/store/useOrdersStore";
import { useAuthStore } from "@/store/useAuthStore";
import { getSocket } from "@/services/socket";
import { FoodOrderStatus } from "@/types";
=======
import { PrimaryButton } from "@/components/PrimaryButton";
import { Icon } from "@/components/Icon";
import { colors, radius, spacing, typography } from "@/theme";
import { useOrdersStore } from "@/store/useOrdersStore";
import { useAuthStore } from "@/store/useAuthStore";
import { FoodOrder, FoodOrderStatus, hasPermission } from "@/types";
import { mapOrderApiError } from "@/utils/orderErrors";
import { PAYMENT_BADGE_COLORS, paymentDisplay } from "@/utils/payment";
>>>>>>> c3d1d3b (vendor work)

const POLL_INTERVAL_MS = 6000;
const ACTIVE_STATUSES: FoodOrderStatus[] = ["VENDOR_ACCEPTED", "PREPARING"];

<<<<<<< HEAD
=======
const NEXT_STEP: Partial<Record<FoodOrderStatus, { to: FoodOrderStatus; label: string; permission: "CAN_UPDATE_ORDER_STATUS" | "CAN_MARK_READY" }>> = {
  VENDOR_ACCEPTED: { to: "PREPARING", label: "Start preparing", permission: "CAN_UPDATE_ORDER_STATUS" },
  PREPARING: { to: "READY_FOR_PICKUP", label: "Ready for pickup", permission: "CAN_MARK_READY" },
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function timeAgo(iso: string): string {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

type Section = { title: string; data: FoodOrder[] };

>>>>>>> c3d1d3b (vendor work)
export default function OrdersScreen() {
  const { orders, loading, error, refresh, transition } = useOrdersStore();
  const user = useAuthStore((s) => s.user);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

<<<<<<< HEAD
  useEffect(() => {
    const socket = getSocket(token);
    if (!socket) return;
=======
  const newestFirst = (a: FoodOrder, b: FoodOrder) => b.createdAt.localeCompare(a.createdAt);
>>>>>>> c3d1d3b (vendor work)

  const sections: Section[] = [];
  const newOrders = orders.filter((o) => o.status === "PLACED").sort(newestFirst);
  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).sort(newestFirst);
  if (newOrders.length) sections.push({ title: `New Orders (${newOrders.length})`, data: newOrders });
  if (activeOrders.length) sections.push({ title: "Active Orders", data: activeOrders });

  const act = async (id: string, to: FoodOrderStatus) => {
    setBusyId(id);
    try {
      await transition(id, to);
    } catch (e) {
      // The store keeps stale data on failure; pull fresh snapshots so the
      // user sees the real state of the order instead of a lying card.
      void refresh();
      Alert.alert("Couldn't update order", mapOrderApiError(e));
    } finally {
      setBusyId(null);
    }
  };

  const confirmReject = (id: string) => {
    Alert.alert("Reject Order", "Are you sure you want to reject this order?", [
      { text: "Cancel", style: "cancel" },
      { text: "Reject Order", style: "destructive", onPress: () => void act(id, "VENDOR_REJECTED") },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={typography.h1}>Orders</Text>
        {queue.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{queue.length}</Text>
          </View>
        )}
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(o) => o.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refresh()} />}
<<<<<<< HEAD
        ListEmptyComponent={
          loading && orders.length === 0 ? (
            <View style={styles.content}>
              <SkeletonOrderCard />
              <SkeletonOrderCard />
            </View>
          ) : (
            <EmptyState icon="bag" title="No open orders" copy="New orders will appear here as customers place them." />
          )
        }
        renderItem={({ item }) => (
          <OrderCard order={item} busy={busyId === item.id} user={user} onAct={(to) => void act(item.id, to)} />
        )}
=======
        ListEmptyComponent={<EmptyState icon="bag" title="No open orders" copy="New orders will show up here as customers place them." />}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        renderItem={({ item }) => <OrderCard order={item} busy={busyId === item.id} user={user} onAccept={() => void act(item.id, "VENDOR_ACCEPTED")} onReject={() => confirmReject(item.id)} onAdvance={(to) => void act(item.id, to)} onView={() => void router.push({ pathname: "/order/[id]", params: { id: item.id } })} />}
>>>>>>> c3d1d3b (vendor work)
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        SectionSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </SafeAreaView>
  );
}

<<<<<<< HEAD
=======
function Countdown({ deadlineAt }: { deadlineAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  const remaining = new Date(deadlineAt).getTime() - now;
  if (remaining <= 0) return null;
  return (
    <View style={styles.countdownRow}>
      <Icon name="time" size={14} color={colors.primary} />
      <Text style={styles.countdownText}>Accept in {formatCountdown(remaining)}</Text>
    </View>
  );
}

function OrderCard({
  order,
  busy,
  user,
  onAccept,
  onReject,
  onAdvance,
  onView,
}: {
  order: FoodOrder;
  busy: boolean;
  user: ReturnType<typeof useAuthStore.getState>["user"];
  onAccept: () => void;
  onReject: () => void;
  onAdvance: (to: FoodOrderStatus) => void;
  onView: () => void;
}) {
  const next = NEXT_STEP[order.status];
  const canAccept = hasPermission(user, "CAN_ACCEPT_ORDER");
  const canReject = hasPermission(user, "CAN_REJECT_ORDER");
  const canAdvance = next ? hasPermission(user, next.permission) : false;

  const itemCount = order.items.length;
  const total = order.bill?.total ?? 0;
  const showCountdown = order.status === "PLACED" && order.manualAcceptanceRequired && Boolean(order.manualAcceptanceDeadlineAt);
  const distance = haversine(order.restaurantLatitude ?? 0, order.restaurantLongitude ?? 0, order.deliveryAddress?.latitude ?? 0, order.deliveryAddress?.longitude ?? 0);

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Text style={typography.h3}>#{order.orderNumber}</Text>
        {order.status === "PLACED" ? (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>New</Text>
          </View>
        ) : (
          <Text style={styles.statusTag}>{order.status.replaceAll("_", " ")}</Text>
        )}
      </View>
      {order.status === "PLACED" && order.autoAccepted ? <Text style={styles.autoTag}>Automatically accepted</Text> : null}

      <Text style={styles.customerName}>{order.customerName ?? "Customer"}</Text>
      <View style={styles.itemPreview}>
        {order.items.slice(0, 2).map((item) => (
          <Text key={item.lineId} numberOfLines={1} style={styles.itemPreviewLine}>
            {item.quantity} × {item.name}
            {item.selectedVariant ? ` (${item.selectedVariant.name})` : ""}
          </Text>
        ))}
        {order.items.length > 2 ? (
          <Text style={styles.itemPreviewMore}>+ {order.items.length - 2} more items</Text>
        ) : null}
      </View>
      <Text style={styles.copy}>
        {itemCount} item{itemCount === 1 ? "" : "s"} • ₹{total}
      </Text>
      <View style={styles.metaRow}>
        <Icon name="location" size={14} color={colors.muted} />
        <Text style={styles.metaText}>
          {distance > 0 ? `${distance.toFixed(1)} km` : "—"} • {order.estimatedDeliveryMinutes ?? 0} mins away
        </Text>
      </View>
      <Text style={styles.timeAgo}>{timeAgo(order.createdAt)}</Text>
      <View style={styles.paymentRow}>
        <Text style={styles.paymentLabel}>Payment:</Text>
        <View style={[styles.paymentBadge, { backgroundColor: PAYMENT_BADGE_COLORS[paymentDisplay(order).tone].background }]}>
          <Text style={[styles.paymentText, { color: PAYMENT_BADGE_COLORS[paymentDisplay(order).tone].text }]}>{paymentDisplay(order).label}</Text>
        </View>
      </View>

      {showCountdown && order.manualAcceptanceDeadlineAt ? <Countdown deadlineAt={order.manualAcceptanceDeadlineAt} /> : null}

      {order.status === "PLACED" ? (
        <View style={styles.actionRow}>
          <View style={{ flex: 1 }}>
            <PrimaryButton label="View" variant="outline" onPress={onView} disabled={busy} />
          </View>
          {canAccept ? (
            <View style={{ flex: 1 }}>
              <PrimaryButton label={busy ? "Please wait…" : "Accept"} onPress={onAccept} loading={busy} />
            </View>
          ) : null}
          {canReject ? (
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Reject" variant="danger" onPress={onReject} disabled={busy} />
            </View>
          ) : null}
        </View>
      ) : next ? (
        canAdvance ? (
          <PrimaryButton label={busy ? "Please wait…" : next.label} onPress={() => onAdvance(next.to)} disabled={busy} />
        ) : (
          <Text style={styles.viewOnly}>You do not have permission to update this order</Text>
        )
      ) : null}
    </View>
  );
}

>>>>>>> c3d1d3b (vendor work)
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  countBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    minWidth: 24,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  countText: { ...typography.captionStrong, color: colors.white },
  content: { padding: spacing.xl, flexGrow: 1 },
<<<<<<< HEAD
=======
  sectionHeader: { ...typography.captionStrong, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5, paddingBottom: spacing.xs },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, gap: 4 },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  newBadge: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  newBadgeText: { color: colors.white, fontWeight: "800", fontSize: 11, textTransform: "uppercase" },
  statusTag: { ...typography.captionStrong, color: colors.primary, textTransform: "uppercase" },
  autoTag: { ...typography.caption, color: colors.success, fontWeight: "700" },
  customerName: { ...typography.h3, color: colors.text },
  itemPreview: { marginTop: spacing.xs, gap: 2 },
  itemPreviewLine: { ...typography.caption, color: colors.text },
  itemPreviewMore: { ...typography.caption, color: colors.muted, fontStyle: "italic" },
  copy: { ...typography.body, color: colors.muted },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { ...typography.caption, color: colors.muted },
  timeAgo: { ...typography.caption, color: colors.text, opacity: 0.7 },
  paymentRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs },
  paymentLabel: { ...typography.captionStrong, color: colors.muted },
  paymentBadge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2, alignSelf: "flex-start" },
  paymentText: { fontWeight: "800", fontSize: 12 },
  countdownRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.xs },
  countdownText: { ...typography.captionStrong, color: colors.primary },
  viewOnly: { ...typography.caption, color: colors.muted, fontStyle: "italic" },
  actionRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
>>>>>>> c3d1d3b (vendor work)
  error: { ...typography.caption, color: colors.error, textAlign: "center", paddingBottom: spacing.md },
});