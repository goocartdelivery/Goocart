import { useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { colors, radius, spacing, typography } from "@/theme";
import { useOrdersStore } from "@/store/useOrdersStore";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useOrdersStore((s) => (id ? s.getOrder(id) : undefined));
  const fetchOrder = useOrdersStore((s) => s.fetchOrder);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) void fetchOrder(id);
  }, [id, fetchOrder]);

  const onRefresh = async () => {
    if (!id) return;
    setRefreshing(true);
    await fetchOrder(id);
    setRefreshing(false);
  };

  if (!order) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScreenHeader title="Order Details" onBack={() => router.back()} />
        <View style={styles.center}>
          <Text style={styles.copy}>Loading order…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title={order.restaurantName ?? "Order"} subtitle={`#${order.orderNumber}`} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={typography.h3}>Status</Text>
            <StatusBadge status={order.status} />
          </View>
          <Text style={styles.copy}>Customer: {order.customerName ?? "—"}</Text>
          <Text style={styles.copy}>Items: {order.items.length}</Text>
          <Text style={styles.copy}>Total: ₹{order.bill?.total ?? 0}</Text>
          <Text style={styles.copy}>Payment: {order.paymentMethod}</Text>
        </View>

        {order.pickupOtp ? (
          <View style={[styles.card, styles.otpCard]}>
            <Text style={typography.eyebrow}>PICKUP CODE</Text>
            <Text style={styles.otpCode}>{order.pickupOtp}</Text>
            <Text style={styles.copy}>Share this code with the delivery partner to collect the order.</Text>
          </View>
        ) : null}

        {order.deliveryOtp ? (
          <View style={[styles.card, styles.otpCard]}>
            <Text style={typography.eyebrow}>DELIVERY CODE</Text>
            <Text style={styles.otpCode}>{order.deliveryOtp}</Text>
            <Text style={styles.copy}>The customer needs this code to confirm delivery.</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={typography.eyebrow}>ITEMS</Text>
          {order.items.map((item) => (
            <Text key={item.lineId} style={styles.copy}>
              {item.quantity} × {item.name}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, gap: spacing.lg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  copy: { ...typography.body, color: colors.muted },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.lg, gap: 6 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  otpCard: { alignItems: "center", backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  otpCode: { fontSize: 36, fontWeight: "900", letterSpacing: 8, color: colors.primary, marginVertical: spacing.sm },
});
