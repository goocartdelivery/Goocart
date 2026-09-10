import { useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "@/components/EmptyState";
import { OrderCard } from "@/components/OrderCard";
import { SkeletonOrderCard } from "@/components/SkeletonLoader";
import { colors, radius, spacing, typography } from "@/theme";
import { useOrdersStore } from "@/store/useOrdersStore";
import { useAuthStore } from "@/store/useAuthStore";
import { getSocket } from "@/services/socket";
import { FoodOrderStatus } from "@/types";

const POLL_INTERVAL_MS = 6000;
const OPEN_STATUSES: FoodOrderStatus[] = ["PLACED", "VENDOR_ACCEPTED", "PREPARING"];

export default function OrdersScreen() {
  const { orders, loading, error, refresh, transition } = useOrdersStore();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const socket = getSocket(token);
    if (!socket) return;

    const onOrderEvent = () => void refresh();
    socket.on("order:new", onOrderEvent);
    socket.on("order:update", onOrderEvent);
    socket.on("order:acceptance_overdue", onOrderEvent);

    return () => {
      socket.off("order:new", onOrderEvent);
      socket.off("order:update", onOrderEvent);
      socket.off("order:acceptance_overdue", onOrderEvent);
    };
  }, [token, refresh]);

  const queue = orders.filter((o) => OPEN_STATUSES.includes(o.status)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const act = async (id: string, to: FoodOrderStatus) => {
    setBusyId(id);
    try {
      await transition(id, to);
    } catch {
      void refresh();
    } finally {
      setBusyId(null);
    }
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
      <FlatList
        data={queue}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refresh()} />}
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
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </SafeAreaView>
  );
}

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
  error: { ...typography.caption, color: colors.error, textAlign: "center", paddingBottom: spacing.md },
});
