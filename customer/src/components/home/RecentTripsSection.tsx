import { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useServiceHomeStore, useServiceTrips } from "@/store/useServiceHomeStore";
import { useAuthStore } from "@/store/useAuthStore";
import { colors, radius, spacing, typography } from "@/theme";
import { ServiceType } from "@/types";

export function RecentTripsSection({ service }: { service: ServiceType }) {
  const user = useAuthStore((s) => s.user);
  const trips = useServiceTrips(service);
  const state = useServiceHomeStore((s) => s.tripsState[service] ?? "idle");
  const loadTrips = useServiceHomeStore((s) => s.loadTrips);

  useEffect(() => {
    if (user) void loadTrips(service);
  }, [user, service, loadTrips]);

  const rows = useMemo(() => trips.slice(0, 3), [trips]);

  if (!user || state === "idle" || state === "error" || rows.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {rows.map((t) => (
        <Pressable
          key={t.id}
          onPress={() => router.push({ pathname: "/service-orders/[id]", params: { id: t.id } })}
          style={styles.row}
          accessibilityRole="button"
        >
          <View style={styles.dot} />
          <View style={styles.info}>
            <Text style={styles.reference} numberOfLines={1}>
              {t.reference}
            </Text>
            <Text style={styles.status} numberOfLines={1}>
              {t.status.replaceAll("_", " ")} • {new Date(t.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <Text style={styles.total}>₹{t.total}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  info: { flex: 1, gap: 2 },
  reference: { ...typography.bodyStrong, fontSize: 13 },
  status: { ...typography.caption, color: colors.muted, fontSize: 11, textTransform: "capitalize" },
  total: { ...typography.bodyStrong, fontSize: 14, color: colors.text },
});