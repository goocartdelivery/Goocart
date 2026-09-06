import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { PrimaryButton } from "@/components/PrimaryButton";
import { EmptyState } from "@/components/EmptyState";
import { RemoteImage } from "@/components/RemoteImage";
import { SkeletonBlock } from "@/components/SkeletonBlock";
import { TrackingMap } from "@/components/TrackingMap";
import { StatusStepper } from "@/orders/StatusStepper";
import { CancelOrderSheet } from "@/orders/CancelOrderSheet";
import { OrdersSectionTitle, Hairline } from "@/orders/OrderFragments";
import { canCancelFood, isFoodCancelled, isFoodOngoing, isFindingPartner, orderStatusLabel } from "@/orders/orderStatus";
import { useLiveOrder } from "@/orders/useLiveOrder";
import { FindingPartnerCard } from "@/orders/FindingPartnerCard";
import { colors, spacing, typography } from "@/theme";
import { Icon } from "@/components/Icon";
import { useOrderStore } from "@/store/useOrderStore";

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { order, riderPosition, notFound } = useLiveOrder(id);
  const cancelOrder = useOrderStore((s) => s.cancelOrder);
  const [showMore, setShowMore] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const doCancel = async (reason: string) => {
    if (!id) return;
    setCancelling(true);
    try {
      await cancelOrder(id, reason);
      setShowCancel(false);
    } catch (e) {
      setCancelling(false);
      Alert.alert("Couldn't cancel", e instanceof Error ? e.message : "Please try again.");
    }
  };

  if (notFound && !order) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScreenHeader title="Track Order" />
        <EmptyState icon="alert" title="Tracking data unavailable" copy="We couldn't find this order to track." />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScreenHeader title="Track Order" />
        <View style={styles.loadingWrap}>
          <SkeletonBlock width="70%" height={28} style={{ borderRadius: 8 }} />
          <SkeletonBlock width="45%" height={14} style={{ marginTop: 8, borderRadius: 8 }} />
          <SkeletonBlock width="100%" height={320} style={{ marginTop: 24, borderRadius: 14 }} />
        </View>
      </SafeAreaView>
    );
  }

  const ongoing = isFoodOngoing(order.status);
  const delivered = order.status === "DELIVERED";
  const cancelled = isFoodCancelled(order.status);
  const findingPartner = isFindingPartner(order);
  // A customer may cancel while waiting for a partner, but never once a partner
  // has actually been assigned (the server enforces the same rule).
  const cancellable = canCancelFood(order.status) && !(order.status === "READY_FOR_PICKUP" && order.deliveryPartner);
  const showMap = ongoing && ["DELIVERY_PARTNER_ASSIGNED", "PICKED_UP", "ON_THE_WAY", "ARRIVED"].includes(order.status);
  const showOtp = showMap && order.deliveryOtp;
  const minutesElapsed = Math.floor((now - new Date(order.createdAt).getTime()) / 60000);
  const etaRemaining = Math.max(1, order.estimatedDeliveryMinutes - minutesElapsed);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title={`Order #${order.orderNumber}`} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status hero */}
        <View style={{ gap: 5 }}>
          <View style={styles.eyebrowRow}>
            <View style={styles.livePulse} />
            <Text style={styles.eyebrow}>{delivered ? "COMPLETED" : cancelled ? "CANCELLED" : "LIVE"}</Text>
          </View>
          <Text style={styles.title}>
            {delivered ? "Delivered" : cancelled ? "Order cancelled" : findingPartner ? "Finding a delivery partner" : orderStatusLabel(order.status)}
          </Text>
          {findingPartner ? (
            <Text style={styles.sub}>{"Your order is ready. We're assigning a rider — hang tight."}</Text>
          ) : ongoing ? (
            <Text style={styles.eta}>Arriving in about {etaRemaining} min</Text>
          ) : delivered ? (
            <Text style={styles.sub}>Enjoy your meal!</Text>
          ) : (
            <Text style={styles.sub}>
              {order.status === "VENDOR_REJECTED" ? `${order.restaurantName} could not accept this order.` : "This order was cancelled."}
            </Text>
          )}
          <Text style={styles.copy} numberOfLines={1}>
            {order.restaurantName} · {order.restaurantArea || "Food"}
          </Text>
        </View>

        {/* Dominant searching module while the platform looks for a partner. */}
        {findingPartner ? (
          <FindingPartnerCard order={order} />
        ) : null}

        {showMap && (
          <View style={styles.mapWrap}>
            <TrackingMap
              height={320}
              restaurant={{ latitude: order.restaurantLatitude, longitude: order.restaurantLongitude, name: order.restaurantName }}
              destination={{ latitude: order.deliveryAddress?.latitude ?? order.restaurantLatitude, longitude: order.deliveryAddress?.longitude ?? order.restaurantLongitude }}
              rider={riderPosition ? { ...riderPosition, name: order.deliveryPartner?.name ?? "Rider" } : null}
            />
          </View>
        )}

        {/* Delivery partner — clean row */}
        {ongoing && order.deliveryPartner ? (
          <Section title="DELIVERY PARTNER">
            <View style={styles.partnerRow}>
              <RemoteImage uri={order.deliveryPartner.photoUrl} fallbackLabel={order.deliveryPartner.name ?? "R"} style={styles.partnerAvatar} />
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={typography.bodyStrong}>{order.deliveryPartner.name}</Text>
                <Text style={styles.muted} numberOfLines={1}>
                  {[order.deliveryPartner.vehicleType, order.deliveryPartner.vehicleNumber].filter(Boolean).join(" • ") || "Your delivery partner"}
                </Text>
              </View>
              {order.deliveryPartner.partnerRating ? (
                <View style={styles.rating}>
                  <Icon name="star" size={13} color={colors.warning} />
                  <Text style={styles.ratingText}>{order.deliveryPartner.partnerRating.toFixed(1)}</Text>
                </View>
              ) : null}
            </View>
          </Section>
        ) : null}

        {/* OTP */}
        {showOtp && (
          <Section title="DELIVERY CODE">
            <Text style={styles.otp}>{order.deliveryOtp}</Text>
            <Text style={styles.muted}>Show this code to your delivery partner to confirm delivery.</Text>
          </Section>
        )}

        {/* Progress timeline */}
        {!delivered && !cancelled && (
          <Section title="ORDER PROGRESS">
            <StatusStepper kind="food" status={order.status} />
          </Section>
        )}

        {/* Terminal-state actions for delivered/cancelled */}
        {delivered ? (
          <View style={styles.actions}>
            <PrimaryButton label="Rate Order" onPress={() => router.push({ pathname: "/rating/[orderId]", params: { orderId: order.id } })} />
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/orders/[id]", params: { id: order.id } })} style={styles.linkRow}>
              <Text style={styles.linkText}>View order details</Text>
              <Icon name="forward" size={15} color={colors.primary} />
            </Pressable>
          </View>
        ) : cancelled ? (
          <View style={styles.actions}>
            <PrimaryButton label="Back to Home" onPress={() => router.replace("/(tabs)/home")} />
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/orders/[id]", params: { id: order.id } })} style={styles.linkRow}>
              <Text style={styles.linkText}>View order details</Text>
              <Icon name="forward" size={15} color={colors.primary} />
            </Pressable>
          </View>
        ) : null}

        {ongoing && !cancellable ? <Text style={styles.noCancel}>Cancellation is no longer available for this order.</Text> : null}
      </ScrollView>

      {/* Quiet secondary actions for active orders */}
      {ongoing && (
        <View style={styles.footer}>
          <Pressable accessibilityRole="button" onPress={() => setShowMore((v) => !v)} style={styles.moreBtn}>
            <Text style={styles.moreBtnText}>More actions</Text>
            <Icon name={showMore ? "close" : "chevronDown"} size={16} color={colors.muted} />
          </Pressable>
          {showMore ? (
            <View style={styles.moreList}>
              {cancellable ? (
                <Pressable accessibilityRole="button" onPress={() => setShowCancel(true)} style={styles.moreItem}>
                  <Icon name="close" size={18} color={colors.error} />
                  <Text style={styles.moreCancel}>Cancel order</Text>
                </Pressable>
              ) : null}
              <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/support/[orderId]", params: { orderId: order.id } })} style={styles.moreItem}>
                <Icon name="activity" size={18} color={colors.muted} />
                <Text style={styles.moreNormal}>Get help with this order</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      )}

      <CancelOrderSheet
        visible={showCancel}
        busy={cancelling}
        orderLabel={`Order #${order.orderNumber}`}
        onClose={() => setShowCancel(false)}
        onConfirm={(reason) => void doCancel(reason)}
      />
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Hairline style={{ marginBottom: spacing.md }} />
      <OrdersSectionTitle>{title}</OrdersSectionTitle>
      <View style={{ marginTop: spacing.md }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loadingWrap: { padding: spacing.xl },
  scroll: { padding: spacing.xl, paddingBottom: 40, gap: spacing.lg },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  livePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  eyebrow: { ...typography.captionStrong, fontSize: 10, letterSpacing: 1.2, color: colors.success, textTransform: "uppercase" },
  title: { ...typography.h1, fontSize: 26 },
  eta: { ...typography.bodyStrong, fontSize: 16, color: colors.primary },
  sub: { ...typography.body, color: colors.muted, marginTop: 2 },
  copy: { ...typography.caption, color: colors.muted },
  mapWrap: { borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  section: { marginTop: spacing.md },
  partnerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  partnerAvatar: { width: 48, height: 48, borderRadius: 12 },
  muted: { ...typography.caption, color: colors.muted },
  rating: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { ...typography.captionStrong },
  otp: { fontSize: 34, fontWeight: "800", letterSpacing: 8, color: colors.text },
  noCancel: { ...typography.caption, color: colors.muted, textAlign: "center", marginTop: spacing.lg },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
  linkRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: spacing.sm },
  linkText: { ...typography.captionStrong, color: colors.primary },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface, padding: spacing.xl, paddingBottom: 28, gap: spacing.sm },
  moreBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 4 },
  moreBtnText: { ...typography.captionStrong, color: colors.muted },
  moreList: { gap: spacing.xs },
  moreItem: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  moreCancel: { ...typography.body, color: colors.error },
  moreNormal: { ...typography.body, color: colors.text },
});
