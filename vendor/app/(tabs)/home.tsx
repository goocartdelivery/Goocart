import { useEffect, useMemo } from "react";
import { Image, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Brand } from "@/components/Brand";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { SkeletonStatRow } from "@/components/SkeletonLoader";
import { colors, radius, spacing, typography } from "@/theme";
import { useVendorStore } from "@/store/useVendorStore";
import { useOrdersStore } from "@/store/useOrdersStore";

const ACTIVE_STATUSES = ["PLACED", "VENDOR_ACCEPTED", "PREPARING"];

export default function HomeScreen() {
  const { restaurant, restaurantLoaded, error, loadRestaurant, setOpen } = useVendorStore();
  const { orders, loading, refresh } = useOrdersStore();

  useEffect(() => {
    void loadRestaurant();
  }, [loadRestaurant]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pendingCount = useMemo(() => orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length, [orders]);
  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3),
    [orders],
  );

  const toggleOpen = async () => {
    if (!restaurant) return;
    try {
      await setOpen(!restaurant.isOpen);
    } catch {}
  };

  if (!restaurantLoaded) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Brand size={28} />
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <SkeletonStatRow />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!restaurant) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Brand size={28} />
        </View>
        <EmptyState
          icon="storefront"
          title="Waiting on setup"
          copy="An admin needs to link your account to a restaurant before you can manage it here."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refresh()} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Brand size={28} />
        </View>

        {/* Restaurant hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            {restaurant.imageUrl ? (
              <Image source={{ uri: restaurant.imageUrl }} style={styles.heroImage} resizeMode="cover" />
            ) : (
              <View style={styles.heroImageEmpty}>
                <Icon name="storefront" size={24} color={colors.muted} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={typography.h2}>{restaurant.name}</Text>
              <View style={styles.areaRow}>
                <Icon name="storefront" size={13} color={colors.muted} />
                <Text style={styles.areaText}>{restaurant.area}</Text>
              </View>
            </View>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <View style={[styles.statusDot, { backgroundColor: restaurant.isOpen ? colors.success : colors.muted }]} />
              <Text style={[styles.statusText, { color: restaurant.isOpen ? colors.success : colors.muted }]}>
                {restaurant.isOpen ? "Open now" : "Closed"}
              </Text>
            </View>
            <Switch
              value={restaurant.isOpen}
              onValueChange={() => void toggleOpen()}
              trackColor={{ false: colors.border, true: colors.successMuted }}
              thumbColor={restaurant.isOpen ? colors.success : colors.surface}
            />
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statRow}>
          <StatCard icon="bag" value={pendingCount} label="Active orders" color={colors.primary} bgColor={colors.primaryMuted} />
          <StatCard icon="time" value={`${restaurant.deliveryTimeMin}-${restaurant.deliveryTimeMax}`} label="Delivery (min)" color="#0284C7" bgColor="#E0F2FE" />
        </View>

        {/* Recent orders */}
        {recentOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent orders</Text>
            {recentOrders.map((o) => (
              <View key={o.id} style={styles.recentCard}>
                <View style={styles.recentRow}>
                  <Text style={styles.recentNum}>#{o.orderNumber}</Text>
                  <StatusBadge status={o.status} />
                </View>
                <Text style={styles.recentItems}>
                  {o.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                </Text>
              </View>
            ))}
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm },
  content: { padding: spacing.xl, paddingTop: 0, gap: spacing.md, paddingBottom: spacing.xxxl },

  /* Hero card */
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  heroImage: { width: 56, height: 56, borderRadius: radius.md },
  heroImageEmpty: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  areaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  areaText: { ...typography.caption, marginLeft: 2 },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  toggleInfo: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { ...typography.bodyStrong },

  /* Stats */
  statRow: { flexDirection: "row", gap: spacing.md },

  /* Recent orders */
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.h3, marginBottom: spacing.xs },
  recentCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  recentRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  recentNum: typography.h3,
  recentItems: { ...typography.caption, marginTop: 2 },

  error: { ...typography.caption, color: colors.error, textAlign: "center" },
});
