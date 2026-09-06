import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { PrimaryButton } from "@/components/PrimaryButton";
import { EmptyState } from "@/components/EmptyState";
import { RemoteImage } from "@/components/RemoteImage";
import { TrackingMap } from "@/components/TrackingMap";
import { SkeletonBlock } from "@/components/SkeletonBlock";
import { BillDetails } from "@/orders/BillDetails";
import { StatusStepper } from "@/orders/StatusStepper";
import { CancelOrderSheet } from "@/orders/CancelOrderSheet";
import { OrdersSectionTitle, Hairline, MoneyRow, MonogramTile } from "@/orders/OrderFragments";
import { canCancelFood, foodEtaArrivalTime, isFoodCancelled, isFoodOngoing, isFindingPartner, orderStatusLabel, SERVICE_ETA_UNAVAILABLE } from "@/orders/orderStatus";
import { useLiveOrder } from "@/orders/useLiveOrder";
import { FindingPartnerCard } from "@/orders/FindingPartnerCard";
import { colors, spacing, typography } from "@/theme";
import { Icon } from "@/components/Icon";
import { useOrderStore } from "@/store/useOrderStore";
import { useReorder } from "@/hooks/useReorder";
import { restaurantService } from "@/services/RestaurantService";
import { Restaurant } from "@/types";

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { order, riderPosition, notFound } = useLiveOrder(id);
  const cancelOrder = useOrderStore((s) => s.cancelOrder);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { reorder, busy: reorderBusy } = useReorder();

  useEffect(() => {
    if (!id || !order?.restaurantId) return;
    let cancelled = false;
    restaurantService
      .getRestaurantWithMenu(order.restaurantId)
      .then((data) => {
        if (!cancelled) setRestaurant(data?.restaurant ?? null);
      })
      .catch(() => {
        if (!cancelled) setRestaurant(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id, order?.restaurantId]);

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

  const state = useMemo(() => {
    if (!order) return null;
    const ongoing = isFoodOngoing(order.status);
    const delivered = order.status === "DELIVERED";
    const cancelled = isFoodCancelled(order.status);
    const findingPartner = isFindingPartner(order);
    const cancellable = canCancelFood(order.status) && !(order.status === "READY_FOR_PICKUP" && order.deliveryPartner);
    const showMap = ongoing && ["DELIVERY_PARTNER_ASSIGNED", "PICKED_UP", "ON_THE_WAY", "ARRIVED"].includes(order.status);
    const cancelledEvent = order.statusHistory?.find((ev) => ev.status === order.status);
    const cancelledAt = cancelledEvent?.at ? new Date(cancelledEvent.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : null;
    return { ongoing, delivered, cancelled, findingPartner, cancellable, showMap, cancelledAt };
  }, [order]);

  if (!order || !state) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScreenHeader title="Order" />
        {notFound ? (
          <EmptyState icon="alert" title="Order not found" copy="This order could not be found." />
        ) : (
          <ScrollView contentContainerStyle={styles.loading}>
            <SkeletonBlock width="60%" height={26} />
            <SkeletonBlock width="40%" height={14} style={{ marginTop: 8 }} />
            <SkeletonBlock width="100%" height={220} style={{ marginTop: 20, borderRadius: 12 }} />
            <SkeletonBlock width="100%" height={120} style={{ marginTop: 20, borderRadius: 12 }} />
            <SkeletonBlock width="100%" height={160} style={{ marginTop: 20, borderRadius: 12 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  const { ongoing, delivered, cancelled, findingPartner, cancellable, showMap, cancelledAt } = state;
  const cod = order.paymentMethod === "COD";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title={`Order #${order.orderNumber}`} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status block */}
        <View style={{ gap: 6 }}>
          <Text style={styles.statusEyebrow}>{ongoing ? "LIVE ORDER" : delivered ? "COMPLETED" : "CANCELLED"}</Text>
          <Text style={styles.statusTitle}>{delivered ? "Delivered" : cancelled ? "Order cancelled" : findingPartner ? "Finding a delivery partner" : orderStatusLabel(order.status)}</Text>
          {findingPartner ? (
            <Text style={styles.statusSub}>{"Your order is ready. We're assigning a rider — hang tight."}</Text>
          ) : ongoing ? (
            <Text style={[styles.statusEta, { color: colors.primary }]}>
              {foodEtaArrivalTime(order) ? `Arriving by ${foodEtaArrivalTime(order)}` : SERVICE_ETA_UNAVAILABLE}
            </Text>
          ) : delivered ? (
            <Text style={styles.statusSub}>Enjoy your meal!</Text>
          ) : (
            <Text style={styles.statusSub}>
              {order.status === "VENDOR_REJECTED" ? `${order.restaurantName} could not accept this order.` : "This order will not be delivered."}
            </Text>
          )}
        </View>

        {/* Dominant searching module while the platform looks for a partner. */}
        {findingPartner ? <FindingPartnerCard order={order} /> : null}

        {/* Live tracking — map is the centerpiece for active delivery orders. */}
        {ongoing && order.deliveryPartner ? (
          <>
            <Block>
              <BlockTitle>YOUR DELIVERY PARTNER</BlockTitle>
              <View style={styles.partnerRow}>
                <RemoteImage uri={order.deliveryPartner.photoUrl} fallbackLabel={order.deliveryPartner.name ?? "P"} style={styles.partnerAvatar} />
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
            </Block>

            {showMap ? (
              <Block>
                <BlockTitle>LIVE TRACKING</BlockTitle>
                <TrackingMap
                  restaurant={{ latitude: order.restaurantLatitude, longitude: order.restaurantLongitude, name: order.restaurantName }}
                  destination={{ latitude: order.deliveryAddress?.latitude ?? order.restaurantLatitude, longitude: order.deliveryAddress?.longitude ?? order.restaurantLongitude }}
                  rider={riderPosition ? { ...riderPosition, name: order.deliveryPartner?.name ?? "Rider" } : null}
                />
                <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/orders/[id]/tracking", params: { id: order.id } })} style={styles.linkRow}>
                  <Text style={styles.linkText}>Open full-screen live tracking</Text>
                  <Icon name="forward" size={15} color={colors.primary} />
                </Pressable>
              </Block>
            ) : null}
          </>
        ) : null}

        {/* Restaurant / store anchor */}
        <Block>
          <BlockTitle>{delivered || cancelled ? "RESTAURANT" : "FROM"}</BlockTitle>
          <View style={styles.restRow}>
            {restaurant?.imageUrl ? <RemoteImage uri={restaurant.imageUrl} fallbackLabel={restaurant.name} style={styles.restImg} /> : <MonogramTile label={order.restaurantName} size={56} radiusValue={10} />}
            <View style={{ flex: 1, gap: 1 }}>
              <Text style={typography.bodyStrong}>{order.restaurantName}</Text>
              {restaurant?.rating ? (
                <View style={styles.ratingInline}>
                  <Icon name="star" size={12} color={colors.warning} />
                  <Text style={styles.ratingText}>{restaurant.rating.toFixed(1)}</Text>
                  {restaurant.ratingCount ? <Text style={styles.muted}> · {restaurant.ratingCount} ratings</Text> : null}
                </View>
              ) : null}
              <Text style={styles.muted} numberOfLines={1}>{restaurant?.area || order.restaurantArea}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/food/restaurant/[id]", params: { id: order.restaurantId } })} style={styles.viewBtn}>
              <Text style={styles.viewText}>View menu</Text>
            </Pressable>
          </View>
        </Block>

        {/* Items */}
        <Block>
          <BlockTitle>ORDER DETAILS</BlockTitle>
          <Text style={styles.muted}>{order.items.length} item{order.items.length > 1 ? "s" : ""}</Text>
          <View style={{ gap: spacing.md }}>
            {order.items.map((item) => (
              <View key={item.lineId} style={styles.itemRow}>
                {item.imageUrl ? <RemoteImage uri={item.imageUrl} fallbackLabel={item.name} style={styles.itemImg} /> : <MonogramTile label={item.name} size={46} radiusValue={8} color={colors.primary} />}
                <View style={{ flex: 1, gap: 1 }}>
                  <Text style={typography.bodyStrong} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.muted}>
                    Qty {item.quantity}
                    {item.selectedVariant ? ` · ${item.selectedVariant.name}` : ""}
                  </Text>
                  {item.selectedAddons.length > 0 ? (
                    <Text style={styles.addon} numberOfLines={1}>
                      {item.selectedAddons.map((a) => `+ ${a.name}`).join(" · ")}
                    </Text>
                  ) : null}
                </View>
                <Text style={typography.bodyStrong}>₹{item.lineTotal}</Text>
              </View>
            ))}
          </View>
        </Block>

        {/* Bill */}
        <Block>
          <BlockTitle>BILL DETAILS</BlockTitle>
          <BillDetails bill={order.bill} />
        </Block>

        {/* Delivery address */}
        <Block>
          <BlockTitle>DELIVERING TO</BlockTitle>
          <Text style={typography.bodyStrong}>{order.deliveryAddress?.label ?? "Delivery address"}</Text>
          <Text style={styles.muted}>
            {[order.deliveryAddress?.line1, order.deliveryAddress?.city, order.deliveryAddress?.state, order.deliveryAddress?.pincode].filter(Boolean).join(", ")}
          </Text>
          {order.deliveryAddress?.contactName ? (
            <Text style={styles.muted}>
              {order.deliveryAddress.contactName} · {order.deliveryAddress.contactPhone}
            </Text>
          ) : null}
        </Block>

        {/* Payment */}
        <Block>
          <BlockTitle>PAYMENT</BlockTitle>
          <MoneyRow label={order.paymentMethod} value={cod ? "Cash on Delivery" : order.paymentStatus === "PAID" ? "Paid" : order.paymentStatus} />
          {cancelled && cod ? <Text style={styles.muted}>You were not charged — Cash on Delivery.</Text> : null}
          {cancelled && order.refund?.status === "PENDING" ? (
            <Text style={styles.refundNote}>Refund of ₹{order.refund.amount ?? order.bill?.total} is being processed.</Text>
          ) : null}
        </Block>

        {/* Progress + metadata */}
        <Block>
          <BlockTitle>ORDER INFORMATION</BlockTitle>
          <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: spacing.xl, rowGap: spacing.md }}>
            <Info label="Order ID" value={order.orderNumber} />
            <Info label="Placed" value={new Date(order.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} />
            <Info label="Est. delivery" value={order.estimatedDeliveryMinutes ? `${order.estimatedDeliveryMinutes} min` : "—"} />
            {order.couponCode ? <Info label="Coupon" value={order.couponCode} /> : null}
          </View>
          {cancelled && cancelledAt ? (
            <View style={{ marginTop: spacing.sm }}>
              <Info label="Cancelled" value={cancelledAt} />
            </View>
          ) : null}
        </Block>

        {!delivered && !cancelled ? (
          <Block>
            <BlockTitle>ORDER PROGRESS</BlockTitle>
            <StatusStepper kind="food" status={order.status} />
          </Block>
        ) : null}

        {ongoing && !cancellable ? <Text style={styles.noCancel}>Cancellation is no longer available for this order.</Text> : null}
      </ScrollView>

      {/* Actions */}
      <View style={styles.footer}>
        {ongoing ? (
          <PrimaryButton label="Track Order" onPress={() => router.push({ pathname: "/orders/[id]/tracking", params: { id: order.id } })} />
        ) : delivered ? (
          <PrimaryButton label="Reorder" loading={reorderBusy} onPress={() => order && void reorder(order)} />
        ) : null}
        {delivered ? (
          <PrimaryButton label="Rate Order" variant="outline" onPress={() => router.push({ pathname: "/rating/[orderId]", params: { orderId: order.id } })} />
        ) : null}

        <Pressable accessibilityRole="button" onPress={() => setShowMore((v) => !v)} style={[styles.moreBtn, showMore && styles.moreBtnOpen]}>
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

function Block({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.block}>
      <Hairline style={{ marginBottom: spacing.md }} />
      {children}
    </View>
  );
}

function BlockTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text style={styles.blockTitleWrap}>
      <OrdersSectionTitle>{children}</OrdersSectionTitle>
    </Text>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 1, minWidth: 100, flex: 1 }}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={typography.body}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loading: { padding: spacing.xl },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 40, gap: spacing.sm },
  statusEyebrow: { ...typography.captionStrong, fontSize: 10, letterSpacing: 1.2, color: colors.primary, textTransform: "uppercase" },
  statusTitle: { ...typography.h1, fontSize: 26 },
  statusEta: { ...typography.bodyStrong, fontSize: 15 },
  statusSub: { ...typography.body, color: colors.muted, marginTop: 2 },
  block: { marginTop: spacing.lg, gap: spacing.sm },
  blockTitleWrap: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  muted: { ...typography.caption, color: colors.muted },
  addon: { ...typography.caption, color: colors.success },
  refundNote: { ...typography.caption, color: colors.primary, marginTop: 2 },
  partnerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  partnerAvatar: { width: 46, height: 46, borderRadius: 12 },
  rating: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingInline: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { ...typography.captionStrong },
  linkRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: spacing.sm },
  linkText: { ...typography.captionStrong, color: colors.primary },
  restRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  restImg: { width: 56, height: 56, borderRadius: 10 },
  viewBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: 6 },
  viewText: { ...typography.captionStrong, color: colors.primary },
  itemRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  itemImg: { width: 46, height: 46, borderRadius: 8 },
  noCancel: { ...typography.caption, color: colors.muted, textAlign: "center", marginTop: spacing.lg },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface, padding: spacing.xl, gap: spacing.sm, paddingBottom: 28 },
  moreBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 4 },
  moreBtnOpen: { marginTop: spacing.xs },
  moreBtnText: { ...typography.captionStrong, color: colors.muted },
  moreList: { gap: spacing.xs, marginTop: spacing.xs },
  moreItem: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  moreCancel: { ...typography.body, color: colors.error },
  moreNormal: { ...typography.body, color: colors.text },
});
