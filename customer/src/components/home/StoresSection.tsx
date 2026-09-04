import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ServiceProduct } from "@/services/ServiceOrderService";
import { colors, radius, spacing, typography } from "@/theme";
import { ServiceType } from "@/types";

// "Stores" are the real vendors behind the service's product catalog, grouped
// from live data — the vendor list is never hardcoded.
export function StoresSection({ products, service }: { products: ServiceProduct[]; service: ServiceType }) {
  const stores = useMemo(() => {
    const map = new Map<string, ServiceProduct[]>();
    for (const p of products) {
      const list = map.get(p.vendorName) ?? [];
      list.push(p);
      map.set(p.vendorName, list);
    }
    return [...map.entries()].map(([name, rows]) => ({ name, count: rows.length, eta: rows[0]?.eta ?? "", rating: rows[0]?.rating ?? 0 }));
  }, [products]);

  if (!stores.length) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.wrap}>
      {stores.map((s) => (
        <Pressable
          key={s.name}
          accessibilityRole="button"
          style={styles.card}
          onPress={() => router.push({ pathname: "/service/[type]", params: { type: service } })}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{s.name.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {s.name}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {s.count} products • {s.eta}
            </Text>
            <View style={styles.ratingPill}>
              <Text style={styles.ratingText}>★ {s.rating.toFixed(1)}</Text>
            </View>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md, paddingHorizontal: spacing.lg },
  card: {
    width: 230,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.primary, fontSize: 19, fontWeight: "900" },
  info: { flex: 1, gap: 2 },
  name: { ...typography.bodyStrong, fontSize: 14 },
  meta: { ...typography.caption, color: colors.muted, fontSize: 10.5 },
  ratingPill: { alignSelf: "flex-start", backgroundColor: colors.success, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  ratingText: { color: colors.white, fontSize: 10, fontWeight: "800" },
});