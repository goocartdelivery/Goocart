import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { OrderSegmented } from "@/orders/OrderSegmented";
import { ActiveOrderHero } from "@/orders/ActiveOrderHero";
import { OrderHistoryList, HistoryListTitle, BaseEntry } from "@/orders/OrderHistoryList";
import { OrderListSkeleton } from "@/orders/OrderSkeleton";
import { OrderEmptyState } from "@/orders/OrderEmpty";
import { Hairline, MonogramTile } from "@/orders/OrderFragments";
import { foodBucket, isFoodReady, isServiceReady, serviceBucket } from "@/orders/orderStatus";
import { ActiveOrder } from "@/orders/useActiveOrders";
import { colors, radius, spacing, typography } from "@/theme";
import { useOrderStore } from "@/store/useOrderStore";
import { useReorder } from "@/hooks/useReorder";
import { serviceOrderService, ServiceOrder } from "@/services/ServiceOrderService";
import { FoodOrder } from "@/types";

type ActivityTab = "ORDERS" | "RIDES" | "PARCELS";
type OrderFilter = "ALL" | "FOOD" | "STORE";
const BUCKETS: { key: "ALL" | "ongoing" | "ready" | "completed" | "cancelled"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "ongoing", label: "Ongoing" },
  { key: "ready", label: "Ready" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];
const TABS: { key: ActivityTab; label: string }[] = [
  { key: "ORDERS", label: "Orders" },
  { key: "RIDES", label: "Rides" },
  { key: "PARCELS", label: "Parcels" },
];
const DOMAINS: { key: OrderFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "FOOD", label: "Food" },
  { key: "STORE", label: "Store" },
];

const orderStatusLabel = (s: string) => s.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function ActivityScreen() {
  const { tab: initialTab } = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<ActivityTab>(initialTab === "RIDES" || initialTab === "PARCELS" ? initialTab : "ORDERS");
  const [filter, setFilter] = useState<OrderFilter>("ALL");
  const [bucket, setBucket] = useState<(typeof BUCKETS)[number]["key"]>("ALL");
  const orders = useOrderStore((s) => s.orders);
  const loading = useOrderStore((s) => s.loading);
  const loadError = useOrderStore((s) => s.error);
  const refresh = useOrderStore((s) => s.refresh);
  const { reorder } = useReorder();
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [serviceError, setServiceError] = useState("");

  const load = useCallback(() => {
    void refresh();
    setServiceLoading(true);
    serviceOrderService
      .activity()
      .then((rows) => {
        setServiceOrders(rows);
        setServiceError("");
      })
      .catch((e) => setServiceError(e instanceof Error ? e.message : "Could not load orders"))
      .finally(() => setServiceLoading(false));
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const foodOrders = orders.filter((o) => o.serviceType === "FOOD");
  const storeOrders = serviceOrders.filter((o) => ["Grocery", "Vegetables", "Mart"].includes(o.service));
  const rideOrders = serviceOrders.filter((o) => o.service === "Bike Taxi");
  const parcelOrders = serviceOrders.filter((o) => o.service === "Parcel");

  const foodInBucket = (status: FoodOrder["status"]) => {
    if (bucket === "ALL") return true;
    if (bucket === "ready") return isFoodReady(status);
    return foodBucket(status) === bucket;
  };
  const storeInBucket = (status: string) => {
    if (bucket === "ALL") return true;
    if (bucket === "ready") return isServiceReady(status);
    return serviceBucket(status) === bucket;
  };

  const visibleFood = foodOrders.filter((o) => (filter === "ALL" || filter === "FOOD") && foodInBucket(o.status));
  const visibleStore = storeOrders.filter((o) => (filter === "ALL" || filter === "STORE") && storeInBucket(o.status));

  const hasAnyOrders = orders.length > 0 || serviceOrders.length > 0;
  const refreshing = loading || serviceLoading;
  const initialLoading = refreshing && !hasAnyOrders;
  const serviceInitialLoading = serviceLoading && serviceOrders.length === 0;

  const activeFood: ActiveOrder[] = visibleFood
    .filter((o) => foodBucket(o.status) === "ongoing")
    .map((order) => ({ kind: "food" as const, order }))
    .sort((a, b) => b.order.createdAt.localeCompare(a.order.createdAt));
  const activeStore: ActiveOrder[] = visibleStore
    .filter((o) => serviceBucket(o.status) === "ongoing")
    .map((order) => ({ kind: "store" as const, order }))
    .sort((a, b) => b.order.createdAt.localeCompare(a.order.createdAt));
  const active = [...activeFood, ...activeStore];

  const hero = active[0];
  const moreActive = active.slice(1);

  const past = buildEntries(
    visibleFood.filter((o) => foodBucket(o.status) !== "ongoing"),
    visibleStore.filter((o) => serviceBucket(o.status) !== "ongoing"),
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.sub}>Food, groceries and more.</Text>
      </View>

      <View style={styles.seg}>
        <OrderSegmented options={TABS} value={tab} onChange={setTab} />
      </View>

      {tab === "ORDERS" && (
        <View style={styles.seg}>
          <OrderSegmented options={BUCKETS} value={bucket} onChange={setBucket} />
          <View style={styles.domainRow}>
            {DOMAINS.map((d) => {
              const isActive = filter === d.key;
              return (
                <Pressable key={d.key} onPress={() => setFilter(d.key)} accessibilityRole="button" accessibilityState={{ selected: isActive }} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  {d.key !== "ALL" ? <View style={[styles.domainDot, { backgroundColor: d.key === "FOOD" ? colors.primary : colors.success }, !isActive && styles.domainDotMuted]} /> : null}
                  <Text style={[styles.domainLabel, isActive && styles.domainLabelActive]}>{d.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.primary} />}
      >
        {tab === "ORDERS" ? (
          <OrdersBody
            initialLoading={initialLoading}
            error={loadError || serviceError}
            hero={hero}
            moreActive={moreActive}
            past={past}
            onRetry={load}
            onOpenFood={(id) => router.push({ pathname: "/orders/[id]", params: { id } })}
            onTrackFood={(id) => router.push({ pathname: "/orders/[id]/tracking", params: { id } })}
            onOpenService={(id) => router.push({ pathname: "/service-orders/[id]", params: { id } })}
            onReorder={(e) => {
              const order = foodOrders.find((o) => o.id === e.id);
              if (order) void reorder(order);
            }}
          />
        ) : tab === "RIDES" ? (
          <ServiceList orders={rideOrders} loading={serviceInitialLoading} error={serviceError} emptyTitle="No bike rides yet" emptyCopy="Book a ride from Home to see it here." icon="bike" onRetry={load} onOpen={(id) => router.push({ pathname: "/service-orders/[id]", params: { id } })} />
        ) : (
          <ServiceList orders={parcelOrders} loading={serviceInitialLoading} error={serviceError} emptyTitle="No parcels yet" emptyCopy="Send a parcel from Home to see it here." icon="parcel" onRetry={load} onOpen={(id) => router.push({ pathname: "/service-orders/[id]", params: { id } })} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function buildEntries(food: FoodOrder[], store: ServiceOrder[]): BaseEntry[] {
  const f: BaseEntry[] = food.map((o) => ({
    id: o.id,
    kind: "food",
    status: o.status,
    createdAt: o.createdAt,
    total: o.bill.total,
    brand: o.restaurantName,
    summary: o.items.slice(0, 2).map((it) => (it.quantity > 1 ? `${it.name} ×${it.quantity}` : it.name)),
  }));
  const s: BaseEntry[] = store.map((o) => {
    const details = (o.details ?? {}) as Record<string, unknown>;
    const items = Array.isArray(details.items) ? (details.items as { name?: string; quantity?: number }[]) : [];
    const services = Array.isArray(details.services) ? (details.services as string[]) : [];
    const summary = items.length ? items.map((it) => (it.quantity && it.quantity > 1 ? `${it.name} ×${it.quantity}` : it.name ?? "Item")) : services;
    return { id: o.id, kind: "store", status: o.status, createdAt: o.createdAt, total: o.total, brand: o.vendorName || o.service, summary };
  });
  return [...f, ...s];
}

function OrdersBody({
  initialLoading,
  error,
  hero,
  moreActive,
  past,
  onRetry,
  onOpenFood,
  onTrackFood,
  onOpenService,
  onReorder,
}: {
  initialLoading: boolean;
  error: string;
  hero: ActiveOrder | undefined;
  moreActive: ActiveOrder[];
  past: BaseEntry[];
  onRetry: () => void;
  onOpenFood: (id: string) => void;
  onTrackFood: (id: string) => void;
  onOpenService: (id: string) => void;
  onReorder: (e: BaseEntry) => void;
}) {
  if (initialLoading) return <OrderListSkeleton count={4} />;

  if (error && !hero && moreActive.length === 0 && past.length === 0) {
    return <OrderEmptyState title="Couldn't load your orders" copy={error} actionLabel="Try Again" onAction={onRetry} />;
  }

  if (!hero && moreActive.length === 0 && past.length === 0) {
    return (
      <OrderEmptyState title="No orders yet" copy="Your food and grocery orders will show up here when you place one." actionLabel="Explore Food" onAction={() => router.push("/(tabs)/home")} />
    );
  }

  const openActive = (e: ActiveOrder) => (e.kind === "food" ? onOpenFood(e.order.id) : onOpenService(e.order.id));
  const trackActive = (e: ActiveOrder) => (e.kind === "food" ? onTrackFood(e.order.id) : onOpenService(e.order.id));

  return (
    <View style={{ gap: spacing.xxl }}>
      {hero || moreActive.length > 0 ? (
        <View style={{ gap: spacing.md }}>
          <ActiveOrderHero entry={hero!} onOpen={() => openActive(hero!)} onTrack={() => trackActive(hero!)} />
          {moreActive.map((e) => (
            <ActiveOrderHero key={`${e.kind}-${e.order.id}`} entry={e} onOpen={() => openActive(e)} onTrack={() => trackActive(e)} />
          ))}
        </View>
      ) : null}

      {past.length > 0 ? (
        <View style={{ gap: spacing.md }}>
          <HistoryListTitle>Past orders</HistoryListTitle>
          <OrderHistoryList
            entries={past}
            onOpen={(e) => (e.kind === "food" ? onOpenFood(e.id) : onOpenService(e.id))}
            onReorder={onReorder}
            accent={(kind) => (kind === "food" ? colors.primary : colors.success)}
          />
        </View>
      ) : null}

      {hero && past.length === 0 ? (
        <View style={{ gap: spacing.md }}>
          <Hairline />
          <Text style={styles.listHint}>Your active orders will appear here until they are delivered or cancelled.</Text>
        </View>
      ) : null}
    </View>
  );
}

function ServiceList({
  orders,
  loading,
  error,
  emptyTitle,
  emptyCopy,
  icon,
  onRetry,
  onOpen,
}: {
  orders: ServiceOrder[];
  loading: boolean;
  error: string;
  emptyTitle: string;
  emptyCopy: string;
  icon: "bike" | "parcel";
  onRetry: () => void;
  onOpen: (id: string) => void;
}) {
  if (loading) return <OrderListSkeleton count={3} />;
  if (error && orders.length === 0) return <OrderEmptyState title="Couldn't load your orders" copy={error} actionLabel="Try Again" onAction={onRetry} />;
  if (orders.length === 0)
    return <OrderEmptyState title={emptyTitle} copy={emptyCopy} actionLabel={icon === "bike" ? "Book a Ride" : "Send a Parcel"} onAction={() => router.push("/(tabs)/home")} />;
  return (
    <View style={{ gap: spacing.xxl }}>
      <View style={{ gap: spacing.md }}>
        <HistoryListTitle>{icon === "bike" ? "Rides" : "Parcels"}</HistoryListTitle>
        {orders
          .slice()
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((o, i) => (
            <View key={o.id}>
              {i > 0 ? <Hairline style={{ marginVertical: spacing.sm }} /> : null}
              <Pressable accessibilityRole="button" onPress={() => onOpen(o.id)} style={styles.svcRow}>
                <MonogramTile label={icon === "bike" ? "R" : "P"} size={48} color={colors.success} radiusValue={radius.sm} />
                <View style={{ flex: 1, gap: 1 }}>
                  <Text style={styles.brand} numberOfLines={1}>{o.reference}</Text>
                  <Text style={styles.meta} numberOfLines={1}>{o.service} · {orderStatusLabel(o.status)}</Text>
                </View>
                <Text style={styles.total}>₹{o.total}</Text>
              </Pressable>
            </View>
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.md, gap: 2 },
  title: { ...typography.display, fontSize: 28 },
  sub: { ...typography.body, color: colors.muted },
  seg: { paddingHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing.sm },
  domainRow: { flexDirection: "row", gap: spacing.xl, paddingVertical: spacing.sm, alignItems: "center" },
  domainDot: { width: 6, height: 6, borderRadius: 3 },
  domainDotMuted: { opacity: 0.25 },
  domainLabel: { ...typography.caption, color: colors.muted, fontWeight: "600" },
  domainLabelActive: { color: colors.text, fontWeight: "800" },
  list: { padding: spacing.xl, paddingTop: spacing.md, flexGrow: 1 },
  listHint: { ...typography.caption, color: colors.muted, textAlign: "center" },
  svcRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  brand: { ...typography.bodyStrong },
  meta: { ...typography.caption, color: colors.muted },
  total: { ...typography.bodyStrong },
});
