import { Pressable, StyleSheet, Text, View } from "react-native";
import { Restaurant } from "@/types";
import { colors, radius, spacing, typography } from "@/theme";
import { Icon } from "@/components/Icon";
import { RemoteImage } from "@/components/RemoteImage";

type Props = {
  restaurant: Restaurant | null;
  restaurantName: string | null;
  onOpenRestaurant: () => void;
  onAddMore: () => void;
};

// Premium identity card for the cart's single restaurant: photo, name, rating,
// cuisine, ETA and a shortcut straight back into the menu.
export function RestaurantSummary({ restaurant, restaurantName, onOpenRestaurant, onAddMore }: Props) {
  const name = restaurant?.name ?? restaurantName ?? "Restaurant";
  const cuisines = restaurant?.cuisines?.length ? restaurant.cuisines.join(" · ") : null;

  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" onPress={onOpenRestaurant} style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
        <RemoteImage uri={restaurant?.imageUrl} fallbackLabel={name} style={styles.photo} />
        <View style={styles.info}>
          <Text style={styles.eyebrow}>ORDERING FROM</Text>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {restaurant ? (
            <View style={styles.badgeRow}>
              <View style={styles.ratingBadge}>
                <Icon name="star" size={11} color={colors.white} />
                <Text style={styles.ratingText}>{restaurant.rating.toFixed(1)}</Text>
              </View>
              <Text style={styles.ratingCount}>({restaurant.ratingCount})</Text>
            </View>
          ) : null}
          {cuisines ? (
            <Text style={styles.cuisines} numberOfLines={1}>
              {cuisines}
            </Text>
          ) : null}
        </View>
        <View style={styles.arrow}>
          <Icon name="forward" size={18} color={colors.muted} />
        </View>
      </Pressable>

      {restaurant ? (
        <View style={styles.metaRow}>
          {restaurant.deliveryTimeMin ? (
            <View style={styles.metaChip}>
              <Icon name="time" size={13} color={colors.muted} />
              <Text style={styles.metaText}>
                {restaurant.deliveryTimeMin}–{restaurant.deliveryTimeMax} min
              </Text>
            </View>
          ) : null}
          {restaurant.area ? (
            <View style={styles.metaChip}>
              <Icon name="location" size={13} color={colors.muted} />
              <Text style={styles.metaText}>{restaurant.area}</Text>
            </View>
          ) : null}
          {restaurant.distanceKm ? (
            <View style={styles.metaChip}>
              <Icon name="bike" size={13} color={colors.muted} />
              <Text style={styles.metaText}>{restaurant.distanceKm.toFixed(1)} km</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.banner}>
        <Icon name="alert" size={14} color="#B45309" />
        <Text style={styles.bannerText}>You can add items only from this restaurant</Text>
      </View>

      <Pressable accessibilityRole="button" onPress={onAddMore} style={({ pressed }) => [styles.addMore, pressed && styles.pressed]}>
        <Icon name="plus" size={16} color={colors.primary} />
        <Text style={styles.addMoreText}>Add more items</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  main: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  photo: { width: 64, height: 64, borderRadius: radius.md },
  info: { flex: 1, gap: 2 },
  eyebrow: { ...typography.eyebrow, fontSize: 10 },
  name: { ...typography.h2, marginTop: 2 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.success,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingText: { color: colors.white, fontSize: 11, fontWeight: "800" },
  ratingCount: { ...typography.caption, fontSize: 11 },
  cuisines: { ...typography.caption, marginTop: 2 },
  arrow: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  metaText: { ...typography.caption, fontSize: 12 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.warningMuted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  bannerText: { ...typography.caption, color: "#B45309", flex: 1, fontWeight: "600" },
  addMore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.8 },
  addMoreText: { ...typography.bodyStrong, color: colors.primary },
});
