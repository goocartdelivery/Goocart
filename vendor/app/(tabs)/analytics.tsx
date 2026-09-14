import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Brand } from "@/components/Brand";
import { colors, radius, spacing, typography } from "@/theme";
import { useVendorStore } from "@/store/useVendorStore";

function formatCurrency(n: number): string {
  return n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${Math.round(n)}`;
}

function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(d)} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(m) - 1]}`;
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[typography.h2, { color }]}>{value}</Text>
      <Text style={typography.h3}>{label}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.barValue}>{value}</Text>
    </View>
  );
}

export default function AnalyticsScreen() {
  const { dashboard, dashboardLoading, error, loadDashboard } = useVendorStore();
  const stats = dashboard?.stats;

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (dashboardLoading && !dashboard) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}>
          <Text style={styles.copy}>Loading analytics…</Text>
        </View>
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
          <Text style={styles.copy}>Unable to load analytics data</Text>
          <Pressable accessibilityRole="button" onPress={() => void loadDashboard()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const month = stats?.month;
  const lifetime = stats?.lifetime;
  const series = stats?.series ?? [];
  const revenueMax = series.reduce((m, s) => Math.max(m, s.revenue), 0);
  const monthDays = series.filter((s) => s.revenue > 0 || s.orders > 0);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Brand size={28} />
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={typography.h1}>Analytics</Text>
        </View>

        <View style={styles.revenueGrid}>
          <View style={[styles.revenueCard, styles.revenueCardPrimary]}>
            <Text style={styles.revenueLabel}>{"Today's Revenue"}</Text>
            <Text style={styles.revenueValuePrimary}>{stats ? formatCurrency(stats.today.revenue) : "—"}</Text>
            <Text style={styles.revenueSub}>{stats?.today.orders ?? 0} orders today</Text>
          </View>
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>This Month</Text>
            <Text style={styles.revenueValue}>{month ? formatCurrency(month.revenue) : "—"}</Text>
            <Text style={styles.revenueSub}>{month?.orders ?? 0} orders</Text>
          </View>
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>All Time</Text>
            <Text style={styles.revenueValue}>{lifetime ? formatCurrency(lifetime.revenue) : "—"}</Text>
            <Text style={styles.revenueSub}>{lifetime?.completed ?? 0} completed</Text>
          </View>
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={typography.h3}>This Month</Text>
        </View>
        <View style={styles.metricsGrid}>
          <StatCard label="Orders" value={String(month?.orders ?? 0)} sub="Placed" color={colors.primary} />
          <StatCard label="Revenue" value={month ? formatCurrency(month.revenue) : "—"} sub="Delivered" color={colors.success} />
          <StatCard label="Completed" value={String(month?.completed ?? 0)} sub="Delivered" color={colors.successMuted} />
          <StatCard label="Active" value={String(month?.active ?? 0)} sub="In progress" color={colors.warning} />
          <StatCard label="Pending" value={String(month?.pending ?? 0)} sub="Waiting" color={colors.primary} />
          <StatCard label="Cancelled" value={String((month?.cancelled ?? 0) + (month?.rejected ?? 0))} sub="Failed" color={colors.error} />
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={typography.h3}>Daily Revenue — This Month</Text>
        </View>
        <View style={styles.chartCard}>
          {monthDays.length === 0 ? (
            <Text style={styles.copy}>No orders yet this month.</Text>
          ) : (
            monthDays.map((s) => (
              <Bar key={s.date} label={shortDate(s.date)} value={Math.round(s.revenue)} max={revenueMax} color={colors.success} />
            ))
          )}
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={typography.h3}>Top Selling Items</Text>
        </View>
        <View style={styles.chartCard}>
          {(stats?.topItems?.length ?? 0) === 0 ? (
            <Text style={styles.copy}>No items sold yet.</Text>
          ) : (
            (stats?.topItems ?? []).map((item, idx) => (
              <View key={`${item.name}-${item.variant ?? ""}-${idx}`} style={styles.topItemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.topItemName}>
                    {item.name}
                    {item.variant ? <Text style={styles.topItemVariant}> ({item.variant})</Text> : null}
                  </Text>
                  <Text style={styles.copy}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.topItemRevenue}>{formatCurrency(item.revenue)}</Text>
              </View>
            ))
          )}
        </View>

        {dashboardLoading ? <Text style={styles.copy}>Refreshing…</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm },
  content: { padding: spacing.xl, paddingTop: 0, gap: spacing.md },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xs },
  revenueGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  revenueCard: { flex: 1, minWidth: "47%", flexGrow: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  revenueCardPrimary: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  revenueLabel: { ...typography.caption, color: colors.muted },
  revenueValue: { ...typography.h3, color: colors.success },
  revenueValuePrimary: { ...typography.h2, color: colors.primary },
  revenueSub: { ...typography.caption, color: colors.muted },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  statCard: { flex: 1, minWidth: "45%", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs, alignItems: "center" },
  statSub: { ...typography.caption, color: colors.muted },
  chartCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  barRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  barLabel: { width: 64, ...typography.caption, color: colors.muted },
  barTrack: { flex: 1, height: 10, backgroundColor: colors.background, borderRadius: radius.sm, overflow: "hidden" },
  barFill: { height: 10, borderRadius: radius.sm },
  barValue: { width: 44, textAlign: "right", ...typography.captionStrong },
  topItemRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.xs },
  topItemName: { ...typography.body, color: colors.text, flexShrink: 1 },
  topItemVariant: { ...typography.caption, color: colors.muted },
  topItemRevenue: { ...typography.bodyStrong, color: colors.text },
  retryBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, marginTop: spacing.sm },
  retryText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  copy: { ...typography.body, color: colors.muted },
});