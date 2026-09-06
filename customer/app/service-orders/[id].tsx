import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { EmptyState } from "@/components/EmptyState";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Icon } from "@/components/Icon";
import { RemoteImage } from "@/components/RemoteImage";
import { SkeletonBlock } from "@/components/SkeletonBlock";
import { StatusStepper } from "@/orders/StatusStepper";
import { OrdersSectionTitle, Hairline, MoneyRow, MonogramTile } from "@/orders/OrderFragments";
import { serviceBucket } from "@/orders/orderStatus";
import { serviceOrderService, ServiceOrder } from "@/services/ServiceOrderService";
import { useReorder } from "@/hooks/useReorder";
import { colors, spacing, typography } from "@/theme";

const POLL_INTERVAL_MS = 5000;

const STEP_LABEL: Record<string, string> = {
  PARTNER_ASSIGNED: "Partner assigned",
  ARRIVING: "Partner arriving",
  IN_PROGRESS: "Ride in progress",
  COMPLETED: "Completed",
  PICKED_UP: "Picked up",
  IN_TRANSIT: "On the way",
  DELIVERED: "Delivered",
};

// One tracking/detail screen for every ServiceOrder (rides, parcels, and
// grocery/mart/vegetables deliveries). Store-first hierarchy for grocery/mart;
// ride/parcel show the fare and route. Rendered with the shared editorial,
// divider-based language used across the whole Order section.
export default function ServiceOrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [notFound, setNotFound] = useState(false);
  const { reorderService, busy: reorderBusy } = useReorder();

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const rows = await serviceOrderService.activity();
      const found = rows.find((row) => row.id === id);
      if (found) {
        setOrder(found);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
    } catch {
      // Transient network error — keep the last known state.
    }
  }, [id]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    const interval = setInterval(() => void load(), POLL_INTERVAL_MS);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [load]);

  if (notFound && !order) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScreenHeader title="Track order" onBack={() => router.back()} />
        <EmptyState icon="alert" title="Order not found" copy="This order could not be found." />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScreenHeader title="Track order" onBack={() => router.back()} />
        <View style={styles.loadingWrap}>
          <SkeletonBlock width="60%" height={26} style={{ borderRadius: 8 }} />
          <SkeletonBlock width="40%" height={14} style={{ marginTop: 8, borderRadius: 8 }} />
          <SkeletonBlock width="100%" height={120} style={{ marginTop: 24, borderRadius: 12 }} />
        </View>
      </SafeAreaView>
    );
  }

  const isRide = order.service === "Bike Taxi";
  const isParcel = order.service === "Parcel";
  const finalStatus = isRide ? "COMPLETED" : "DELIVERED";
  const cancelled = order.status.startsWith("CANCELLED");
  const finished = order.status === finalStatus;
  const pending = order.status === "READY_FOR_PICKUP";
  const code = String(order.details.verificationCode ?? "");
  const pickup = String(order.details.pickup ?? "");
  const drop = String(order.details.drop ?? "");
  const distanceKm = order.details.distanceKm;
  const items: { name?: string; quantity?: number; price?: number }[] = Array.isArray(order.details.items)
    ? (order.details.items as { name?: string; quantity?: number; price?: number }[])
    : [];
  const brand = order.vendorName || order.service;
  const meta = isRide || isParcel ? (isRide ? "Bike Taxi" : "Parcel") : "GoCart Store";
  const statusLabel = pending ? "Matching you with a nearby partner…" : STEP_LABEL[order.status] ?? order.status.replaceAll("_", " ");

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title={order.reference} onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status hero */}
        <View style={{ gap: 6 }}>
          <Text style={styles.eyebrow}>{finished ? "COMPLETED" : cancelled ? "CANCELLED" : "LIVE"}</Text>
          <Text style={styles.title}>{finished ? (isRide ? "Ride completed" : "Delivered") : cancelled ? "Cancelled" : statusLabel}</Text>
          <Text style={styles.muted}>
            {meta} · {order.service}
          </Text>
        </View>

        {!finished && !cancelled && (
          <>
            {/* Merchant / product anchor (store-first for groceries/mart) */}
            {!isRide && !isParcel ? (
              <Section>
                <SectionTitle>STORE</SectionTitle>
                <View style={styles.brandRow}>
                  <MonogramTile label={brand} size={52} color={colors.success} radiusValue={10} />
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text style={typography.bodyStrong}>{brand}</Text>
                    <Text style={styles.muted}>GoCart Store</Text>
                  </View>
                </View>
              </Section>
            ) : null}

            {/* Route / fare */}
            {pickup || drop ? (
              <Section>
                <SectionTitle>{isRide ? "TRIP DETAILS" : "DELIVERY"}</SectionTitle>
                {pickup ? (
                  <View style={styles.locRow}>
                    <View style={styles.locDot} />
                    <Text style={styles.locText}>{pickup}</Text>
                  </View>
                ) : null}
                {drop ? (
                  <View style={styles.locRow}>
                    <View style={[styles.locDot, styles.locDotEnd]} />
                    <Text style={styles.locText}>{drop}</Text>
                  </View>
                ) : null}
                {typeof distanceKm === "number" ? <Text style={styles.muted}>{distanceKm} km trip</Text> : null}
              </Section>
            ) : null}

            {/* Products */}
            {items.length ? (
              <Section>
                <SectionTitle>PRODUCTS</SectionTitle>
                <View style={{ gap: spacing.md }}>
                  {items.map((item, index) => (
                    <View key={`${item.name ?? "item"}-${index}`} style={styles.itemRow}>
                      <MonogramTile label={item.name ?? "I"} size={40} color={colors.success} radiusValue={8} />
                      <View style={{ flex: 1 }}>
                        <Text style={typography.bodyStrong} numberOfLines={1}>{item.name ?? "Item"}</Text>
                        <Text style={styles.muted}>Qty {item.quantity ?? 1}</Text>
                      </View>
                      {typeof item.price === "number" ? <Text style={typography.bodyStrong}>₹{item.price}</Text> : null}
                    </View>
                  ))}
                </View>
              </Section>
            ) : null}

            {/* Delivery partner */}
            {order.partner ? (
              <Section>
                <SectionTitle>{isRide ? "YOUR DRIVER" : "DELIVERY PARTNER"}</SectionTitle>
                <View style={styles.partnerRow}>
                  <RemoteImage uri={order.partner.photoUrl} fallbackLabel={order.partner.name ?? "P"} style={styles.partnerAvatar} />
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text style={typography.bodyStrong}>{order.partner.name}</Text>
                    <Text style={styles.muted} numberOfLines={1}>
                      {[order.partner.vehicleType, order.partner.vehicleNumber].filter(Boolean).join(" • ") || `Your ${isRide ? "driver" : "delivery partner"}`}
                    </Text>
                  </View>
                  {order.partner.partnerRating ? (
                    <View style={styles.rating}>
                      <Icon name="star" size={13} color={colors.warning} />
                      <Text style={styles.ratingText}>{order.partner.partnerRating.toFixed(1)}</Text>
                    </View>
                  ) : null}
                </View>
              </Section>
            ) : null}

            {/* Verification code */}
            {!pending && code ? (
              <Section>
                <SectionTitle>DELIVERY CODE</SectionTitle>
                <Text style={styles.otp}>{code}</Text>
                <Text style={styles.muted}>Show this code to your partner to confirm.</Text>
              </Section>
            ) : null}

            {/* Progress */}
            <Section>
              <SectionTitle>ORDER PROGRESS</SectionTitle>
              <StatusStepper kind={isRide ? "ride" : "store"} status={order.status} />
            </Section>
          </>
        )}

        {finished || cancelled ? (
          <View style={styles.actions}>
            <PrimaryButton label="Back to activity" onPress={() => router.replace("/(tabs)/activity")} />
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/support/[orderId]", params: { orderId: order.id } })} style={styles.linkRow}>
              <Text style={styles.linkText}>Get help with this order</Text>
              <Icon name="forward" size={15} color={colors.primary} />
            </Pressable>
          </View>
        ) : null}

        {/* Fare + reorder */}
        <Section>
          {!finished && !cancelled ? <SectionTitle>PAYMENT</SectionTitle> : null}
          <MoneyRow label="Order total" value={`₹${order.total}`} strong />
          <Text style={styles.orderInfoText}>Order {order.reference} · Placed {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</Text>
        </Section>

        {!isRide && !isParcel && serviceBucket(order.status) === "completed" && finished ? (
          <PrimaryButton label="Reorder" variant="secondary" loading={reorderBusy} onPress={() => order && void reorderService(order)} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Hairline style={{ marginBottom: spacing.md }} />
      {children}
    </View>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <OrdersSectionTitle>{children}</OrdersSectionTitle>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loadingWrap: { padding: spacing.xl },
  scroll: { padding: spacing.xl, paddingBottom: 40, gap: spacing.sm },
  eyebrow: { ...typography.captionStrong, fontSize: 10, letterSpacing: 1.2, color: colors.primary, textTransform: "uppercase" },
  title: { ...typography.h1, fontSize: 26 },
  muted: { ...typography.caption, color: colors.muted },
  section: { marginTop: spacing.lg, gap: spacing.xs },
  brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.xs },
  locRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  locDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 3 },
  locDotEnd: { backgroundColor: colors.success },
  locText: { ...typography.body, flex: 1 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  partnerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.xs },
  partnerAvatar: { width: 46, height: 46, borderRadius: 12 },
  rating: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { ...typography.captionStrong },
  otp: { fontSize: 32, fontWeight: "800", letterSpacing: 8, color: colors.text },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
  linkRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: spacing.sm },
  linkText: { ...typography.captionStrong, color: colors.primary },
  orderInfoText: { ...typography.caption, color: colors.muted, textAlign: "center", marginTop: spacing.sm },
});
