import { StyleSheet, Text, View } from "react-native";
import { Restaurant } from "@/types";
import { colors, radius, spacing, typography } from "@/theme";
import { Icon } from "@/components/Icon";

// Presentational restaurant information block. Only renders fields the backend
// actually provides; unsupported features are simply omitted. Styled as a
// floating card that overlaps the rounded hero for a premium look.
export function RestaurantInfo({ restaurant }: { restaurant: Restaurant }) {
  return (
    <View style={styles.card}>
      {/* Name + dietary tag row */}
      <View style={styles.headRow}>
        <View style={styles.headTextWrap}>
          <Text style={styles.name} numberOfLines={2}>
            {restaurant.name}
          </Text>
          <Text style={styles.cuisines} numberOfLines={2}>
            {restaurant.cuisines.join(" · ")}
          </Text>
        </View>
        {restaurant.vegOnly ? (
          <View style={styles.vegPill}>
            <Icon name="vegetables" size={14} color={colors.success} />
            <Text style={styles.vegPillText}>VEG</Text>
          </View>
        ) : null}
      </View>

      {/* Stat chips: rating, delivery time, distance */}
      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Icon name="star" size={14} color={colors.warning} />
          <Text style={styles.statValue}>{restaurant.rating.toFixed(1)}</Text>
          <Text style={styles.statMeta}>({restaurant.ratingCount})</Text>
        </View>
        <View style={styles.statChip}>
          <Icon name="time" size={14} color={colors.primary} />
          <Text style={styles.statValue}>
            {restaurant.deliveryTimeMin}–{restaurant.deliveryTimeMax}
          </Text>
          <Text style={styles.statMeta}>min</Text>
        </View>
        <View style={styles.statChip}>
          <Icon name="bike" size={14} color={colors.primary} />
          <Text style={styles.statValue}>{restaurant.distanceKm}</Text>
          <Text style={styles.statMeta}>km</Text>
        </View>
      </View>

      {/* Status + location row */}
      <View style={styles.metaRow}>
        <View style={[styles.statusPill, { backgroundColor: restaurant.isOpen ? colors.successMuted : colors.errorMuted }]}>
          <View style={[styles.statusDot, { backgroundColor: restaurant.isOpen ? colors.success : colors.error }]} />
          <Text style={[styles.statusText, { color: restaurant.isOpen ? colors.success : colors.error }]}>
            {restaurant.isOpen ? "Open Now" : "Closed Now"}
          </Text>
        </View>
        <View style={styles.locationWrap}>
          <Icon name="location" size={14} color={colors.muted} />
          <Text style={styles.locationText} numberOfLines={1}>
            {restaurant.area || "Location on map"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.xl,
    marginTop: -spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  headRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  headTextWrap: { flex: 1 },
  name: { ...typography.h2, fontSize: 20 },
  cuisines: { ...typography.caption, marginTop: 4, lineHeight: 16 },
  vegPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.successMuted,
  },
  vegPillText: { color: colors.success, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  statsRow: { flexDirection: "row", gap: spacing.sm },
  statChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  statValue: { ...typography.bodyStrong, fontSize: 13 },
  statMeta: { ...typography.caption, fontSize: 11 },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radius.pill },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: "800" },
  locationWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4, justifyContent: "flex-end" },
  locationText: { ...typography.caption, fontSize: 11, flexShrink: 1, textAlign: "right" },
});
