import { useCallback, useEffect, useMemo, useState } from "react";
import { Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { WavyHero } from "@/components/home/WavyHero";
import { ServiceSearch } from "@/components/home/ServiceSearch";
import { ServiceTabs } from "@/components/home/ServiceTabs";
import { ServiceSubcategoryStrip } from "@/components/home/ServiceSubcategoryStrip";
import { BrandsSection } from "@/components/home/BrandsSection";
import { OffersSection } from "@/components/home/OffersSection";
import { StoresSection } from "@/components/home/StoresSection";
import { ProductSection } from "@/components/home/ProductSection";
import { JobBookingCard } from "@/components/home/JobBookingCard";
import { GroceryHomeSections } from "@/components/home/GroceryHomeSections";
import { RecentTripsSection } from "@/components/home/RecentTripsSection";
import { RestaurantCard } from "@/components/RestaurantCard";
import { RestaurantCardSkeleton } from "@/components/SkeletonBlock";
import { Icon } from "@/components/Icon";
import { SectionHeader } from "@/components/SectionHeader";
import { RecommendedSection } from "@/components/RecommendedSection";
import { restaurantService } from "@/services/RestaurantService";
import { serviceToRecCategory } from "@/services/RecommendationService";
import { HomeCategory, serviceConfig } from "@/constants/serviceHome";
import { colors, radius, spacing, typography } from "@/theme";
import { useActiveServiceStore } from "@/store/useActiveServiceStore";
import { useLocationStore } from "@/store/useLocationStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useCategorySelectionStore, categoryForService } from "@/store/useCategorySelectionStore";
import { useServiceHomeStore, useServiceProducts } from "@/store/useServiceHomeStore";
import { MOCK_RESTAURANTS, normalizeRestaurantData } from "@/data/restaurantMock";
import { filterRestaurantsByCategory } from "@/utils/foodFilter";
import { Restaurant } from "@/types";

export default function HomeScreen() {
  const active = useActiveServiceStore((s) => s.active);
  const config = serviceConfig(active);

  const location = useLocationStore((s) => s.selected);
  const user = useAuthStore((s) => s.user);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const toggleFav = useFavoritesStore((s) => s.toggle);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  // Selected subcategory (Food + product services). Stored service-tagged so
  // switching services never leaks a stale selection, and shared with the
  // standalone search screen so search stays scoped to the active subcategory.
  const selection = useCategorySelectionStore((s) => s.selection);
  const setCategory = useCategorySelectionStore((s) => s.setCategory);
  const selectedCategory = categoryForService(selection, active);

  const onSelectCategory = (c: HomeCategory | null) => {
    setCategory(active, c);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (active === "FOOD") {
      setRefreshTick((t) => t + 1);
    } else {
      await useServiceHomeStore.getState().loadProducts(active, true);
    }
    setRefreshing(false);
  }, [active]);

  const onHeroCta = () => {
    if (active === "FOOD") {
      router.push("/food");
    } else {
      router.push({ pathname: "/service/[type]", params: { type: active } });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ===== Top Header ===== */}
      <View style={styles.header}>
        <Pressable style={styles.locationWrap} onPress={() => router.push("/location")} accessibilityRole="button">
          <View style={styles.locationPin}>
            <Icon name="location" size={18} color={colors.primary} />
          </View>
          <View style={styles.locationText}>
            <View style={styles.locationTopRow}>
              <Text style={styles.deliveringTo}>Delivering to</Text>
              <Icon name="chevronDown" size={14} color={colors.muted} />
            </View>
            <Text style={styles.locationCity} numberOfLines={1}>
              {location?.city ?? "Jangareddygudem"}
            </Text>
            <Text style={styles.locationAddress} numberOfLines={1}>
              {location?.address ?? "51/64 B, Barakhamba, Arjun Nagar, Agra, UP"}
            </Text>
          </View>
        </Pressable>

        <View style={styles.headerRight}>
          <Pressable style={styles.iconButton} accessibilityLabel="Notifications">
            <Icon name="notification" size={22} color={colors.dark} />
            <View style={styles.notifDot} />
          </Pressable>
          <Pressable style={styles.profileAvatar} onPress={() => router.push("/(tabs)/account")} accessibilityLabel="Account">
            <Text style={styles.profileText}>{(user?.name ?? "G").slice(0, 1).toUpperCase()}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        stickyHeaderIndices={[1]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.primary} />}
      >
        {/* Main category tabs — scroll away with content */}
        <ServiceTabs />

        {/* Per-service subcategory strip. A real direct child at a stable index
            (index 1) so native sticky headers pin it just below the fixed header
            while the tabs and content scroll away beneath it. */}
        <ServiceSubcategoryStrip selectedCategory={selectedCategory} onSelectCategory={onSelectCategory} />

        {/* FadeSlide wraps banner + content so it transitions on tab switch */}
        <FadeSlide trigger={active}>
          {/* Full-width banner */}
          <WavyHero config={config} onCta={onHeroCta} />

          {/* Search bar — only for Food / Grocery / Mart; hidden for Taxi / Parcel */}
          {active === "FOOD" || active === "GROCERY" || active === "MART" || active === "VEGETABLES" ? (
            <View style={styles.searchWrap}>
              <ServiceSearch />
            </View>
          ) : null}

          {/* Per-service content */}
          {config.kind === "food" ? (
            <FoodContent
              key={active}
              refreshTick={refreshTick}
              isFavorite={isFavorite}
              toggleFav={toggleFav}
              selectedCategory={selectedCategory}
            />
          ) : config.kind === "products" ? (
            <ProductContent key={active} config={config} refreshTick={refreshTick} selectedCategory={selectedCategory} />
          ) : (
            <JobContent key={active} service={active} />
          )}
        </FadeSlide>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ===================== Food portal ===================== */

function FoodContent({
  refreshTick,
  isFavorite,
  toggleFav,
  selectedCategory,
}: {
  refreshTick: number;
  isFavorite: (id: string) => boolean;
  toggleFav: (id: string) => void;
  selectedCategory: HomeCategory | null;
}) {
  const config = serviceConfig("FOOD");
  const [vegOnly, setVegOnly] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  // Real restaurant data first (MongoDB -> backend -> API). Only if the API
  // fails or returns no open restaurants do we fall back to mock data, so the
  // "Popular Near You" section is never blank.
  useEffect(() => {
    let cancelled = false;
    restaurantService
      .listRestaurants()
      .then((list) => {
        if (cancelled) return;
        const open = normalizeRestaurantData(list.filter((r) => r.isOpen));
        if (open.length > 0) {
          setRestaurants(open);
          setUsingMock(false);
        } else {
          setRestaurants(normalizeRestaurantData(MOCK_RESTAURANTS));
          setUsingMock(true);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Restaurant API error:", error);
        setRestaurants(normalizeRestaurantData(MOCK_RESTAURANTS));
        setUsingMock(true);
      })
      .finally(() => {
        if (!cancelled) setRestaurantsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  // Real + mock data, restricted to the selected subcategory (Biryani/Pizza/
  // Burger/...). null selectedCategory means "All Food" (no subcategory filter).
  const byCategory = useMemo(
    () => filterRestaurantsByCategory(restaurants, selectedCategory),
    [restaurants, selectedCategory],
  );

  // One shared filter for real and mock data: toggle OFF shows all, toggle ON
  // (check active) shows only Veg restaurants.
  const visible = useMemo(
    () => (vegOnly ? byCategory.filter((r) => r.vegOnly) : byCategory),
    [byCategory, vegOnly],
  );
  const fastDelivery = useMemo(
    () => [...byCategory].sort((a, b) => a.deliveryTimeMin - b.deliveryTimeMin).slice(0, 6),
    [byCategory],
  );

  return (
    <>
      <View style={styles.section}>
        <RecommendedSection category="food" />
      </View>

      <View style={styles.popularSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={typography.h2}>Popular Near You</Text>
          <View style={styles.vegToggleWrap}>
            <Text style={styles.vegLabel}>VEG</Text>
            <Switch
              value={vegOnly}
              onValueChange={setVegOnly}
              trackColor={{ false: "#E7E4E1", true: colors.success }}
              thumbColor={colors.white}
              ios_backgroundColor="#E7E4E1"
              style={styles.vegSwitch}
              accessibilityLabel="Vegetarian only"
            />
          </View>
        </View>
        {usingMock ? (
          <Text style={styles.mockHint}>Showing sample restaurants — live data is temporarily unavailable.</Text>
        ) : null}
        {restaurantsLoading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {[1, 2, 3].map((i) => (
              <RestaurantCardSkeleton key={i} />
            ))}
          </ScrollView>
        ) : visible.length === 0 ? (
          <Text style={styles.offlineText}>No restaurants right now.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {visible.map((r) => (
              <RestaurantCard
                key={r.id}
                restaurant={r}
                favorite={isFavorite(r.id)}
                onToggleFav={() => toggleFav(r.id)}
                onPress={() => router.push({ pathname: "/food/restaurant/[id]", params: { id: r.id } })}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {fastDelivery.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Fast Delivery" subtitle="Quickest first" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {fastDelivery.map((r) => (
              <RestaurantCard
                key={r.id}
                restaurant={r}
                favorite={isFavorite(r.id)}
                onToggleFav={() => toggleFav(r.id)}
                onPress={() => router.push({ pathname: "/food/restaurant/[id]", params: { id: r.id } })}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Offers for you" subtitle="Live discounts & coupons" />
        <OffersSection />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Top Brands on Goocart" />
        <BrandsSection brands={config.brands} service={config.type} />
      </View>
    </>
  );
}

/* ===================== Grocery / Veg / Mart portal ===================== */

function ProductContent({
  config,
  refreshTick,
  selectedCategory,
}: {
  config: ReturnType<typeof serviceConfig>;
  refreshTick: number;
  selectedCategory: HomeCategory | null;
}) {
  const products = useServiceProducts(config.type);

  useEffect(() => {
    if (refreshTick > 0) void useServiceHomeStore.getState().loadProducts(config.type, true);
  }, [refreshTick, config.type]);

  if (config.type === "GROCERY") {
    return <GroceryHomeSections selectedCategory={selectedCategory} />;
  }

  return (
    <>
      <View style={styles.section}>
        <RecommendedSection category={serviceToRecCategory(config.type)} />
      </View>

      {products.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title={`Popular ${config.tabLabel} stores`} subtitle="Live stock from vendors near you" />
          <StoresSection products={products} service={config.type} />
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader
          title={selectedCategory ? selectedCategory.label : `Fresh ${config.tabLabel} picks`}
          subtitle="Pay at checkout \u2022 Live pricing"
        />
        <ProductSection config={config} category={selectedCategory} />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Offers for you" subtitle="Live discounts & coupons" />
        <OffersSection />
      </View>

      <View style={styles.section}>
        <SectionHeader title={`Top ${config.tabLabel} brands`} />
        <BrandsSection brands={config.brands} service={config.type} />
      </View>
    </>
  );
}

/* ===================== Bike Taxi / Parcel portal ===================== */

function JobContent({ service }: { service: ReturnType<typeof serviceConfig>["type"] }) {
  const config = serviceConfig(service);
  return (
    <>
      <View style={styles.section}>
        <SectionHeader title={config.type === "BIKE_TAXI" ? "Book a ride" : "Send a parcel"} subtitle="Set pickup & drop to see the live fare" />
        <JobBookingCard config={config} />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Live offers" subtitle="Valid on all trips" />
        <OffersSection />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Recent trips" subtitle="Tap to view details" />
        <RecentTripsSection service={service} />
      </View>
    </>
  );
}

/* ===================== Transition helper ===================== */

function FadeSlide({ trigger, children }: { trigger: string; children: React.ReactNode }) {
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(14));

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(14);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, [trigger, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

/* ===================== Styles ===================== */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.lg },

  // -------- Header --------
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  locationWrap: { flex: 1, flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, minWidth: 0 },
  locationPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  locationText: { flex: 1, minWidth: 0 },
  locationTopRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  deliveringTo: { color: colors.muted, fontSize: 12, fontWeight: "500" },
  locationCity: { color: colors.dark, fontSize: 16, fontWeight: "800", marginTop: 1 },
  locationAddress: { color: colors.muted, fontSize: 11, fontWeight: "500", marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  iconButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  profileAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  profileText: { color: colors.white, fontSize: 15, fontWeight: "800" },

  // -------- Search + Veg --------
  searchWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    rowGap: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  vegToggleWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    gap: 6,
    backgroundColor: colors.surface,
    paddingLeft: spacing.md,
    paddingRight: 3,
    height: 30,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  vegLabel: { color: colors.success, fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  vegSwitch: { transform: [{ scaleX: 0.6 }, { scaleY: 0.6 }], marginHorizontal: -6 },

  mockHint: { marginHorizontal: spacing.lg, color: colors.muted, fontSize: 11, fontWeight: "500" },
  offlineText: { marginHorizontal: spacing.lg, color: colors.muted, fontSize: 13 },

  // -------- Sections --------
  section: { gap: spacing.md },
  popularSection: { gap: spacing.md, paddingTop: spacing.xl },
  hScroll: { gap: spacing.md, paddingHorizontal: spacing.lg },
  offlineCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    gap: 4,
  },
});
