import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Brand } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { colors, radius, spacing, typography } from "@/theme";
import { useOrdersStore } from "@/store/useOrdersStore";
import { apiGet, apiPost } from "@/services/apiClient";
import { FoodOrder, FoodOrderStatus } from "@/types";
import { mapOrderApiError } from "@/utils/orderErrors";
import { PAYMENT_BADGE_COLORS, PAYMENT_METHOD_LABEL, paymentDisplay } from "@/utils/payment";

function formatINR(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function NewOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders, refresh } = useOrdersStore();

  const [order, setOrder] = useState<FoodOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>("--:--");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [accepted, setAccepted] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [expired, setExpired] = useState(false);

  const deadlineMs = order?.manualAcceptanceDeadlineAt ? new Date(order.manualAcceptanceDeadlineAt).getTime() : null;

  const distance = useMemo(() => {
    if (!order) return 0;
    const restLat = order.restaurantLatitude ?? 0;
    const restLon = order.restaurantLongitude ?? 0;
    const delLat = order.deliveryAddress?.latitude ?? 0;
    const delLon = order.deliveryAddress?.longitude ?? 0;
    return haversine(restLat, restLon, delLat, delLon);
  }, [order]);

  const etaMins = order?.estimatedDeliveryMinutes ?? 0;

  // Fetch order
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<{ order: FoodOrder }>(`/api/v1/orders/${id}`);
        if (!cancelled) {
          setOrder(data.order);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load order");
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Countdown timer
  useEffect(() => {
    if (accepted || rejected || expired || !deadlineMs) return;
    const tick = () => {
      setNowMs(Date.now());
      const remaining = deadlineMs - Date.now();
      setCountdown(formatCountdown(remaining));
      if (remaining <= 0) {
        setCountdown("00:00");
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadlineMs, accepted, rejected, expired]);

  // Check if order status changed from realtime update (the global
  // useVendorRealtime hook keeps the orders store fresh; this effect mirrors
  // the latest status into the screen's local state). Deliberately deferred
  // off the synchronous effect body (React Compiler purity).
  useEffect(() => {
    if (!order) return;
    const latest = orders.find((o) => o.id === order.id);
    if (!latest || latest.status === order.status) return;
    const t = setTimeout(() => {
      setOrder(latest);
      if (latest.status === "VENDOR_ACCEPTED" && !accepted) {
        setAccepted(true);
        setTimeout(() => router.replace("/orders"), 1500);
      }
      if (latest.status === "VENDOR_REJECTED" && !rejected) {
        setRejected(true);
        setTimeout(() => router.replace("/orders"), 1500);
      }
      if (latest.status === "EXPIRED" && !expired) {
        setExpired(true);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [orders, order, accepted, rejected, expired]);

  const act = async (to: FoodOrderStatus) => {
    if (!order) return;
    setActionLoading(true);
    try {
      const result = await apiPost<{ order: FoodOrder }>(`/api/v1/orders/${order.id}/transition`, { to });
      setOrder(result.order);
      if (to === "VENDOR_ACCEPTED") {
        setAccepted(true);
        setTimeout(() => router.replace("/orders"), 1500);
      } else if (to === "VENDOR_REJECTED") {
        setRejected(true);
        setTimeout(() => router.replace("/orders"), 1500);
      }
    } catch (e) {
      setError(mapOrderApiError(e));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = () => {
    if (!order) return;
    Alert.alert(
      "Reject Order",
      "Are you sure you want to reject this order?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reject Order", style: "destructive", onPress: () => void act("VENDOR_REJECTED") },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.copy}>Loading order…</Text></View>
      </SafeAreaView>
    );
  }

  if (error && !order) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}><Brand size={24} /><Text style={styles.error}>{error}</Text></View>
      </SafeAreaView>
    );
  }

  if (!order) return null;

  const isExpired = expired || order.status === "EXPIRED" || (deadlineMs !== null && nowMs >= deadlineMs);
  const canAct = order.status === "PLACED" && !accepted && !rejected && !isExpired;
  const timeUp = isExpired && order.status === "PLACED";

  const payment = paymentDisplay(order);
  const paymentColors = PAYMENT_BADGE_COLORS[payment.tone];
  const methodLabel = PAYMENT_METHOD_LABEL[order.paymentMethod ?? ""] ?? order.paymentMethod ?? "—";
  const bill = order.bill;
  const discount = (bill?.restaurantDiscount ?? 0) + (bill?.couponDiscount ?? 0);
  const contactName = order.deliveryAddress?.contactName;
  const contactPhone = order.deliveryAddress?.contactPhone;
  const addressLines = [
    order.deliveryAddress?.line1,
    order.deliveryAddress?.building,
    order.deliveryAddress?.street,
    order.deliveryAddress?.landmark,
    `${[order.deliveryAddress?.city, order.deliveryAddress?.state].filter(Boolean).join(", ")} ${order.deliveryAddress?.pincode ?? ""}`.trim(),
  ]
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .join(", ");

  const callCustomer = () => {
    if (contactPhone) void Linking.openURL(`tel:${contactPhone}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={actionLoading} onRefresh={() => void refresh()} />}
      >
        <View style={styles.header}>
          <Brand size={28} />
        </View>

        {/* Countdown banner */}
        {canAct && (
          <View style={styles.countdownBanner}>
            <Icon name="time" size={18} color={colors.white} />
            <Text style={styles.countdownText}>Auto reject in {countdown}</Text>
          </View>
        )}

        {/* Order hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>New Order Received!</Text>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <Text style={styles.heroSub}>
            {order.items.length} item{order.items.length === 1 ? "" : "s"} • {formatINR(bill.total)}
          </Text>
          <Text style={styles.heroTime}>Placed {formatDateTime(order.createdAt)}</Text>
        </View>

        {/* Customer */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.cardRow}>
            <View style={styles.customerInfo}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{order.customerName?.slice(0, 2).toUpperCase() ?? "C"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.h3}>{order.customerName}</Text>
                {contactName || contactPhone ? <Text style={styles.copy}>{contactName ?? contactPhone}</Text> : null}
              </View>
            </View>
            {contactPhone ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Call customer" onPress={callCustomer} style={styles.iconBtn}>
                <Icon name="call" size={20} color={colors.primary} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Order items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items.map((item) => (
            <View key={item.lineId} style={styles.itemRow}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.itemThumb} resizeMode="cover" />
              ) : (
                <View style={[styles.itemThumb, styles.itemThumbEmpty]}>
                  <Icon name="image" size={18} color={colors.muted} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={styles.itemNameRow}>
                  {typeof item.veg === "boolean" ? (
                    <View style={[styles.vegBadge, { borderColor: item.veg ? "#228B22" : "#B91C1C" }]}>
                      <View style={[styles.vegDot, { backgroundColor: item.veg ? "#228B22" : "#B91C1C" }]} />
                    </View>
                  ) : null}
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
                <Text style={styles.itemMeta}>
                  Qty: {item.quantity} × {formatINR(item.unitPrice)}
                </Text>
                {item.selectedVariant ? <Text style={styles.itemVariant}>{item.selectedVariant.name}</Text> : null}
                {item.selectedAddons?.length ? <Text style={styles.itemVariant}>{item.selectedAddons.map((a) => a.name).join(", ")}</Text> : null}
              </View>
              <Text style={styles.itemTotal}>{formatINR(item.lineTotal)}</Text>
            </View>
          ))}
        </View>

        {/* Special instructions */}
        {(order.instructions?.length ?? 0) > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Special Instructions</Text>
            {order.instructions.map((inst) => (
              <Text key={inst} style={styles.copy}>• {inst}</Text>
            ))}
          </View>
        ) : null}

        {/* Order summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Item Total</Text>
            <Text style={styles.summaryValue}>{formatINR(bill.itemTotal ?? 0)}</Text>
          </View>
          {discount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={styles.summaryDiscount}>-{formatINR(discount)}</Text>
            </View>
          ) : null}
          {bill?.deliveryFee ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>{formatINR(bill.deliveryFee)}</Text>
            </View>
          ) : null}
          {bill?.platformFee ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Platform Fee</Text>
              <Text style={styles.summaryValue}>{formatINR(bill.platformFee)}</Text>
            </View>
          ) : null}
          {bill?.taxes ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taxes</Text>
              <Text style={styles.summaryValue}>{formatINR(bill.taxes)}</Text>
            </View>
          ) : null}
          {bill?.tip ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tip</Text>
              <Text style={styles.summaryValue}>{formatINR(bill.tip)}</Text>
            </View>
          ) : null}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatINR(bill.total ?? 0)}</Text>
          </View>
        </View>

        {/* Payment */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.summaryLabel}>Status</Text>
            <View style={[styles.paymentBadge, { backgroundColor: paymentColors.background }]}>
              <Text style={[styles.paymentBadgeText, { color: paymentColors.text }]}>{payment.label}</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Method</Text>
            <Text style={styles.summaryValue}>{methodLabel}</Text>
          </View>
        </View>

        {/* Delivery */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery</Text>
          {addressLines ? <Text style={styles.deliveryAddress}>{addressLines}</Text> : null}
          <Text style={styles.copy}>
            {distance > 0 ? `${distance.toFixed(1)} km` : "Calculating…"} • {etaMins} mins away
          </Text>
        </View>

        {/* Action buttons */}
        {canAct ? (
          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reject order"
              onPress={handleReject}
              disabled={actionLoading}
              style={[styles.rejectBtn, actionLoading && styles.btnDisabled]}
            >
              <Text style={styles.rejectText}>{actionLoading ? "Rejecting…" : "Reject"}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Accept order"
              onPress={() => void act("VENDOR_ACCEPTED")}
              disabled={actionLoading}
              style={[styles.acceptBtn, actionLoading && styles.btnDisabled]}
            >
              <Text style={styles.acceptText}>{actionLoading ? "Accepting…" : "Accept Order"}</Text>
            </Pressable>
          </View>
        ) : timeUp || order.status === "EXPIRED" ? (
          <View style={[styles.actionRow, styles.statusCard]}>
            <Icon name="alert" size={20} color={colors.error} />
            <View style={{ flex: 1 }}>
              <Text style={styles.statusText}>Order Expired</Text>
              <Text style={styles.copy}>The acceptance window has closed. Please check the orders list.</Text>
            </View>
          </View>
        ) : accepted ? (
          <View style={[styles.actionRow, styles.statusCard]}>
            <Icon name="checkCircle" size={20} color={colors.success} />
            <Text style={styles.statusText}>Order Accepted</Text>
          </View>
        ) : rejected ? (
          <View style={[styles.actionRow, styles.statusCard]}>
            <Icon name="close" size={20} color={colors.error} />
            <Text style={styles.statusText}>Order Rejected</Text>
          </View>
        ) : null}

        {error && !accepted && !rejected && !timeUp ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  content: { padding: spacing.xl, paddingTop: 0, gap: spacing.md },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm },
  countdownBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: spacing.sm },
  countdownText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  heroCard: { backgroundColor: colors.primaryMuted, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, alignItems: "center", gap: spacing.sm },
  heroTitle: { ...typography.h2, color: colors.primary, textAlign: "center" },
  orderNumber: { ...typography.display, color: colors.dark },
  heroSub: { ...typography.body, color: colors.muted },
  heroTime: { ...typography.caption, color: colors.muted },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  sectionTitle: { ...typography.h3, marginBottom: spacing.xs },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  customerInfo: { flexDirection: "row", alignItems: "center", gap: spacing.md, flex: 1 },
  avatarCircle: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.dark, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.white, fontWeight: "800", fontSize: 15 },
  iconBtn: { width: 40, height: 40, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  copy: { ...typography.caption, color: colors.muted },
  itemRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, paddingVertical: spacing.sm },
  itemThumb: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.background },
  itemThumbEmpty: { alignItems: "center", justifyContent: "center" },
  itemNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  vegBadge: { width: 14, height: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  itemName: { ...typography.body, color: colors.text, flexShrink: 1 },
  itemMeta: { ...typography.caption, color: colors.muted, marginTop: 2 },
  itemVariant: { ...typography.caption, color: colors.muted, marginTop: 2 },
  itemTotal: { ...typography.bodyStrong, color: colors.text },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 3 },
  summaryLabel: { ...typography.body, color: colors.text },
  summaryValue: { ...typography.bodyStrong, color: colors.text },
  summaryDiscount: { ...typography.bodyStrong, color: colors.success },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  totalLabel: { ...typography.h3, color: colors.text },
  totalValue: { ...typography.h1, color: colors.text },
  paymentRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 3 },
  paymentBadge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  paymentBadgeText: { fontWeight: "800", fontSize: 12 },
  deliveryAddress: { ...typography.body, color: colors.text },
  actionRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  rejectBtn: { flex: 1, minHeight: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.primary, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, paddingHorizontal: spacing.xl },
  rejectText: { color: colors.primary, fontWeight: "700", fontSize: 15 },
  acceptBtn: { flex: 2, minHeight: 52, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  acceptText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  btnDisabled: { opacity: 0.5 },
  statusCard: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg },
  statusText: { ...typography.h3 },
  error: { ...typography.caption, color: colors.error, textAlign: "center", paddingBottom: spacing.md },
});
