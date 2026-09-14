import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import { RemoteImage } from "@/components/RemoteImage";
import { Icon } from "@/components/Icon";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonBlock } from "@/components/SkeletonBlock";
import { HomeCategory } from "@/constants/serviceHome";
import { Dish, restaurantService } from "@/services/RestaurantService";
import { colors, radius, spacing, typography } from "@/theme";

type Props = {
  category: HomeCategory;
  accent: string;
  primaryMuted: string;
};

// The subcategory-selected content area for Food: real dishes matched by the
// catalog's server-side keyword lookup (Food + Biryani etc.). Tapping a dish
// opens its restaurant menu, where the existing add-to-cart flow takes over.
export function FoodDishSection({ category, accent, primaryMuted }: Props) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [retryTick, setRetryTick] = useState(0);
  const { cardWidth } = useCardWidth();

  useEffect(() => {
    let cancelled = false;
    setQuery("");
    setLoading(true);
    setError("");
    // Start from an empty list so a slow response never shows the previous
    // subcategory's dishes under the new heading.
    setDishes([]);
    restaurantService
      .dishesByCategory(category.keywords)
      .then((rows) => {
        if (cancelled) return;
        setDishes(rows);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not load dishes");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category.key, category.keywords, retryTick]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dishes;
    return dishes.filter((d) => `${d.name} ${d.description ?? ""} ${d.restaurantName}`.toLowerCase().includes(q));
  }, [dishes, query]);

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <View style={[styles.headIcon, { backgroundColor: primaryMuted }]}>
          <Text style={styles.headEmoji}>🍽️</Text>
        </View>
        <View style={styles.headText}>
          <Text style={styles.title}>{category.label}</Text>
          <Text style={styles.subtitle}>
            {loading ? "Loading dishes…" : error ? "Could not load dishes" : `${dishes.length} dish${dishes.length === 1 ? "" : "es"} • from nearby restaurants`}
          </Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Icon name="search" size={16} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={`Search within ${category.label}`}
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          autoCorrect={false}
          accessibilityLabel={`Search within ${category.label}`}
        />
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={typography.bodyStrong}>Couldn\u2019t load {category.label.toLowerCase()} dishes</Text>
          <Text style={styles.errorDetail}>{error}</Text>
          <Pressable onPress={() => setRetryTick((t) => t + 1)} accessibilityRole="button" accessibilityLabel="Retry loading dishes">
            <Text style={styles.retry}>Tap to retry</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <GridSkeleton cardWidth={cardWidth} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="food"
            title={query ? `No matches for "${query}"` : `No ${category.label.toLowerCase()} dishes right now`}
            copy={query ? "Try a different search term." : "Restaurants add live dishes from the vendor portal. Check back soon."}
          />
        </View>
      ) : (
        <View style={styles.grid}>
          {filtered.map((d) => (
            <DishCard key={d.id} dish={d} cardWidth={cardWidth} accent={accent} />
          ))}
        </View>
      )}
    </View>
  );
}

function DishCard({ dish, cardWidth, accent }: { dish: Dish; cardWidth: number; accent: string }) {
  const hasDiscount = dish.discountPercent > 0;
  const finalPrice = hasDiscount ? Math.round(dish.price * (1 - dish.discountPercent / 100)) : dish.price;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: "/food/restaurant/[id]", params: { id: dish.restaurantId } })}
      style={({ pressed }) => [styles.card, { width: cardWidth }, pressed && styles.pressed]}
    >
      <View>
        <RemoteImage uri={dish.imageUrl} fallbackLabel={dish.name} style={styles.cardImage} contentFit="cover" />
        {dish.veg ? (
          <View style={styles.vegBadge}>
            <View style={styles.vegDot} />
          </View>
        ) : null}
        {hasDiscount ? (
          <View style={[styles.discountBadge, { backgroundColor: accent }]}>
            <Text style={styles.discountText}>{dish.discountPercent}% OFF</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.nameRow}>
          <Text style={styles.cardName} numberOfLines={2}>
            {dish.name}
          </Text>
          {dish.bestseller ? (
            <Text style={[styles.bestseller, { color: accent }]}>Bestseller</Text>
          ) : null}
        </View>
        <Text style={styles.cardDesc} numberOfLines={1}>
          {dish.restaurantName}
        </Text>
        <View style={styles.cardPriceRow}>
          <Text style={[styles.cardPrice, { color: accent }]}>₹{finalPrice}</Text>
          {hasDiscount ? <Text style={styles.cardMrp}>₹{dish.price}</Text> : null}
          {dish.rating ? (
            <View style={styles.ratingRow}>
              <Icon name="star" size={11} color={colors.warning} />
              <Text style={styles.ratingText}>{dish.rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function useCardWidth(): { cardWidth: number } {
  const { width } = useWindowDimensions();
  return { cardWidth: Math.floor((Math.min(width, 1080) - spacing.lg * 2 - spacing.md) / 2) };
}

function GridSkeleton({ cardWidth }: { cardWidth: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={{ width: cardWidth }}>
          <SkeletonBlock width="100%" height={140} style={styles.skImage} />
          <View style={{ padding: spacing.sm, gap: 6 }}>
            <SkeletonBlock width="80%" height={12} />
            <SkeletonBlock width="55%" height={10} />
            <SkeletonBlock width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg },
  headIcon: { width: 46, height: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  headEmoji: { fontSize: 24 },
  headText: { flex: 1, minWidth: 0 },
  title: { ...typography.h2 },
  subtitle: { ...typography.caption, color: colors.muted, marginTop: 2 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, ...typography.body, fontSize: 13, color: colors.text },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, paddingHorizontal: spacing.lg },
  card: {
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  pressed: { opacity: 0.9 },
  cardImage: { width: "100%", aspectRatio: 1 },
  vegBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.success,
  },
  vegDot: { width: 11, height: 11, backgroundColor: colors.success, margin: 2.5, borderRadius: 2 },
  discountBadge: {
    position: "absolute",
    left: 6,
    bottom: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  discountText: { color: colors.white, fontSize: 10, fontWeight: "800", letterSpacing: 0.2 },
  cardBody: { padding: spacing.sm, gap: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardName: { ...typography.bodyStrong, fontSize: 13, flexShrink: 1 },
  bestseller: { fontSize: 9.5, fontWeight: "800" },
  cardDesc: { ...typography.caption, color: colors.muted, fontSize: 10.5 },
  cardPriceRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 4 },
  cardPrice: { fontSize: 16, fontWeight: "900" },
  cardMrp: { ...typography.caption, color: colors.muted, textDecorationLine: "line-through", fontSize: 11 },
  ratingRow: { flexDirection: "row", alignItems: "baseline", gap: 2, marginLeft: "auto" },
  ratingText: { ...typography.caption, color: colors.text, fontSize: 10.5, fontWeight: "700" },
  skImage: { borderRadius: 0 },
  errorCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  retry: { ...typography.caption, color: colors.primary, fontWeight: "800" },
  errorDetail: { ...typography.caption, color: colors.error, fontSize: 10.5 },
  emptyWrap: { paddingHorizontal: spacing.lg },
});