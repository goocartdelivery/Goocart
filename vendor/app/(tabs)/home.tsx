import { useEffect, useMemo } from "react";
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Brand } from "@/components/Brand";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { SkeletonStatRow } from "@/components/SkeletonLoader";
import { colors, radius, spacing, typography } from "@/theme";
import { useVendorStore } from "@/store/useVendorStore";

function formatCurrency(n: number): string {
  return n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n}`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const { dashboard, dashboardLoading, error, loadDashboard, setOpen } = useVendorStore();
  const { width } = useWindowDimensions();

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const stats = dashboard?.stats;
  const vendor = dashboard?.vendor;
  const quickActions = dashboard?.quickActions;

<<<<<<< HEAD
  const pendingCount = useMemo(() => orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length, [orders]);
  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3),
    [orders],
  );
=======
  const isOpen = vendor?.isAcceptingOrders ?? false;
>>>>>>> c3d1d3b (vendor work)

  const toggleOpen = async () => {
    try {
<<<<<<< HEAD
      await setOpen(!restaurant.isOpen);
    } catch {}
=======
      await setOpen(!isOpen);
      void loadDashboard();
    } catch {
      // Store surfaces the error via its `error` field.
    }
>>>>>>> c3d1d3b (vendor work)
  };

  const statCards = useMemo(() => {
    if (!stats) return [];
    return [
      { label: "Today's Orders", value: String(stats.today.orders), icon: "bag" as const, color: colors.primary },
      { label: "Revenue", value: formatCurrency(stats.today.revenue), icon: "cash" as const, color: colors.success },
      { label: "Pending", value: String(stats.pendingOrders), icon: "time" as const, color: colors.warning },
      { label: "Completed", value: String(stats.today.completed), icon: "checkCircle" as const, color: colors.successMuted },
    ];
  }, [stats]);

  if (dashboardLoading && !dashboard) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
<<<<<<< HEAD
        <View style={styles.header}>
          <Brand size={28} />
=======
        <View style={styles.center}>
          <Text style={styles.copy}>Loading your dashboard…</Text>
>>>>>>> c3d1d3b (vendor work)
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <SkeletonStatRow />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error && !dashboard) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Brand size={28} />
        </View>
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => void loadDashboard()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!vendor) {
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
<<<<<<< HEAD
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refresh()} />}
        showsVerticalScrollIndicator={false}
=======
        refreshControl={<RefreshControl refreshing={dashboardLoading} onRefresh={() => void loadDashboard()} />}
>>>>>>> c3d1d3b (vendor work)
      >
        <View style={styles.header}>
          <Brand size={28} />
        </View>

<<<<<<< HEAD
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
=======
        <View style={styles.greetingCard}>
          <View style={{ flex: 1 }}>
            <Text style={typography.body}>{getGreeting()},</Text>
            <Text style={typography.h2}>{vendor.name}</Text>
            <View style={styles.locationRow}>
              <Icon name="location" size={14} color={colors.muted} />
              <Text style={styles.locationText}>{vendor.location}</Text>
>>>>>>> c3d1d3b (vendor work)
            </View>
          </View>
<<<<<<< HEAD
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
=======
          {vendor.imageUrl ? (
            <Image source={{ uri: vendor.imageUrl }} style={styles.avatarThumb} resizeMode="cover" />
          ) : (
            <View style={styles.avatarThumbEmpty}>
              <Icon name="account" size={28} color={colors.muted} />
            </View>
          )}
        </View>

        <View style={styles.toggleCard}>
          <View style={{ flex: 1 }}>
            <Text style={typography.h3}>Online Status</Text>
            <Text style={styles.copy}>{isOpen ? "Accepting orders" : "Not accepting orders"}</Text>
          </View>
          <Switch
            value={isOpen}
            onValueChange={() => void toggleOpen()}
            trackColor={{ false: colors.border, true: colors.successMuted }}
            thumbColor={isOpen ? colors.success : colors.surface}
          />
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={typography.h3}>{"Today's Summary"}</Text>
        </View>
        <View style={[styles.statRow, { gap: spacing.sm }]}>
          {statCards.map((card) => (
            <View key={card.label} style={[styles.statCard, { width: (width - spacing.xl * 2 - spacing.sm) / 2 }]}>
              <View style={[styles.statIconCircle, { backgroundColor: card.color + "18" }]}>
                <Icon name={card.icon} size={18} color={card.color} />
              </View>
              <Text style={typography.h1}>{card.value}</Text>
              <Text style={styles.statLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={typography.h3}>Revenue</Text>
        </View>
        <View style={styles.revenueCard}>
          <View style={styles.revenueHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.copy}>Today</Text>
              <Text style={styles.revenueValue}>{stats ? formatCurrency(stats.today.revenue) : "—"}</Text>
            </View>
            <View style={styles.revenueDivider} />
            <View style={{ flex: 1 }}>
              <Text style={styles.copy}>This Month</Text>
              <Text style={styles.revenueValue}>{stats ? formatCurrency(stats.month.revenue) : "—"}</Text>
            </View>
            <View style={styles.revenueDivider} />
            <View style={{ flex: 1 }}>
              <Text style={styles.copy}>All Time</Text>
              <Text style={styles.revenueValue}>{stats ? formatCurrency(stats.lifetime.revenue) : "—"}</Text>
            </View>
          </View>
          {stats && stats.lifetime.completed > 0 ? (
            <Text style={styles.copy}>Avg order value: {formatCurrency(Math.round(stats.lifetime.revenue / stats.lifetime.completed))}</Text>
          ) : null}
        </View>

        <View style={styles.alertCard}>
          <View style={styles.alertBadge}>
            <Icon name="notifications" size={16} color={colors.white} />
            <Text style={styles.alertBadgeCount}>{stats?.newOrders ?? 0}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={typography.h3}>New Orders</Text>
            <Text style={styles.copy}>
              {stats?.newOrders === 1 ? "1 order needs your attention" : `${stats?.newOrders ?? 0} orders waiting to be accepted`}
            </Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push("/orders")} style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>View</Text>
          </Pressable>
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={typography.h3}>Quick Actions</Text>
        </View>
        <View style={styles.quickGrid}>
          <Pressable accessibilityRole="button" onPress={() => router.push("/menu")} style={[styles.quickBtn, { width: (width - spacing.xl * 2 - spacing.md) / 2 }]}>
            <View style={styles.quickIconCircle}>
              <Icon name="menu" size={22} color={colors.white} />
            </View>
            <Text style={styles.quickLabel}>Menu</Text>
            <Text style={styles.quickCount}>{quickActions?.menuCount ?? 0}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push("/orders")} style={[styles.quickBtn, { width: (width - spacing.xl * 2 - spacing.md) / 2 }]}>
            <View style={[styles.quickIconCircle, { backgroundColor: colors.primary }]}>
              <Icon name="orders" size={22} color={colors.white} />
            </View>
            <Text style={styles.quickLabel}>Orders</Text>
            <Text style={[styles.quickCount, stats && stats.pendingOrders > 0 && styles.quickCountBadge]}>{stats?.pendingOrders ?? 0}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push("/analytics")} style={[styles.quickBtn, { width: (width - spacing.xl * 2 - spacing.md) / 2 }]}>
            <View style={[styles.quickIconCircle, { backgroundColor: colors.dark }]}>
              <Icon name="analytics" size={22} color={colors.white} />
            </View>
            <Text style={styles.quickLabel}>Analytics</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push("/profile")} style={[styles.quickBtn, { width: (width - spacing.xl * 2 - spacing.md) / 2 }]}>
            <View style={[styles.quickIconCircle, { backgroundColor: colors.dark }]}>
              <Icon name="account" size={22} color={colors.white} />
            </View>
            <Text style={styles.quickLabel}>Profile</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => { void setOpen(!isOpen); void loadDashboard(); }} style={[styles.quickBtn, { width: (width - spacing.xl * 2 - spacing.md) / 2 }]}>
            <View style={[styles.quickIconCircle, { backgroundColor: isOpen ? colors.success : colors.border }]}>
              <Icon name={isOpen ? "check" : "close"} size={22} color={colors.white} />
            </View>
            <Text style={styles.quickLabel}>{isOpen ? "Open" : "Close"}</Text>
          </Pressable>
        </View>

        {dashboardLoading ? <Text style={styles.error}>Refreshing…</Text> : null}
>>>>>>> c3d1d3b (vendor work)
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm },
<<<<<<< HEAD
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

=======
  content: { padding: spacing.xl, paddingTop: 0, gap: spacing.md },
  greetingCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg },
  avatarThumb: { width: 48, height: 48, borderRadius: radius.md },
  avatarThumbEmpty: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  locationText: { ...typography.caption, color: colors.muted },
  toggleCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  statCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, alignItems: "center" },
  statIconCircle: { width: 36, height: 36, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  statLabel: { ...typography.caption, color: colors.muted },
  revenueCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  revenueHead: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  revenueDivider: { width: 1, alignSelf: "stretch", backgroundColor: colors.border },
  revenueValue: { ...typography.h3, color: colors.success },
  retryBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, marginTop: spacing.sm },
  retryText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  alertCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.primaryMuted, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg },
  alertBadge: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  alertBadgeCount: { color: colors.white, fontWeight: "800", fontSize: 14 },
  viewAllBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.primary, borderRadius: radius.md },
  viewAllText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  quickBtn: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg },
  quickIconCircle: { width: 44, height: 44, borderRadius: radius.md, alignItems: "center", justifyContent: "center", backgroundColor: colors.dark },
  quickLabel: { ...typography.captionStrong, color: colors.text },
  quickCount: { ...typography.caption, color: colors.muted },
  quickCountBadge: { color: colors.primary, fontWeight: "700" },
  copy: { ...typography.body, color: colors.muted },
>>>>>>> c3d1d3b (vendor work)
  error: { ...typography.caption, color: colors.error, textAlign: "center" },
});
