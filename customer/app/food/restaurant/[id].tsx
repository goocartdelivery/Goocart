import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Platform, Pressable, Share, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { restaurantService } from "@/services/RestaurantService";
import { cartLineId, useCartBill, useCartItemCount, useCartStore } from "@/store/useCartStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { colors, radius, spacing } from "@/theme";
import { Icon } from "@/components/Icon";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonBlock } from "@/components/SkeletonBlock";
import { StickyCartBar } from "@/components/StickyCartBar";
import { CustomizeSheet } from "@/components/CustomizeSheet";
import { RestaurantHeader } from "@/components/restaurant/RestaurantHeader";
import { RestaurantInfo } from "@/components/restaurant/RestaurantInfo";
import { RestaurantOffers } from "@/components/restaurant/RestaurantOffers";
import { MenuSearchBar } from "@/components/restaurant/MenuSearchBar";
import { MenuFilters, MenuFilterState } from "@/components/restaurant/MenuFilters";
import { MenuCategoryNav } from "@/components/restaurant/MenuCategoryNav";
import { MenuSection } from "@/components/restaurant/MenuSection";
import { FoodItemCard } from "@/components/restaurant/FoodItemCard";
import { CartLineItem, FoodItem, MenuCategory, Restaurant } from "@/types";

const COMPACT_H = 52;
const NAV_H = 56;
const STICKY_OFFSET = COMPACT_H + NAV_H + 8;

const EMPTY_FILTERS: MenuFilterState = { vegOnly: false, bestsellerOnly: false, rated4Plus: false };

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [restaurant, setRestaurant] = useState<Restaurant | null | undefined>(undefined);
  const [menu, setMenu] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [menuSearch, setMenuSearch] = useState("");
  const [filters, setFilters] = useState<MenuFilterState>(EMPTY_FILTERS);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [customizeItem, setCustomizeItem] = useState<FoodItem | null>(null);
  const [inlineNavTop, setInlineNavTop] = useState(99999);
  const [collapsed, setCollapsed] = useState(false);

  const scrollY = useMemo(() => new Animated.Value(0), []);
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});

  const cartRestaurantId = useCartStore((s) => s.restaurantId);
  const cartRestaurantName = useCartStore((s) => s.restaurantName);
  const cartItems = useCartStore((s) => s.items);
  const totalItems = useCartItemCount();
  const bill = useCartBill();
  const addItem = useCartStore((s) => s.addItem);
  const replaceCartWithItem = useCartStore((s) => s.replaceCartWithItem);
  const updateQty = useCartStore((s) => s.updateQty);

  const isFavorite = useFavoritesStore((s) => (id ? s.isFavorite(id) : false));
  const toggleFavorite = useFavoritesStore((s) => s.toggle);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    restaurantService
      .getRestaurantWithMenu(id)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setRestaurant(null);
          return;
        }
        setRestaurant(data.restaurant);
        setCategories(data.categories);
        setMenu(data.items);
        setLoadError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : "Couldn't load this restaurant.");
        setRestaurant(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const isSearch = menuSearch.trim().length > 0;

  const passesFilters = useCallback(
    (item: FoodItem) => {
      if (filters.vegOnly && !item.veg) return false;
      if (filters.bestsellerOnly && !item.bestseller) return false;
      if (filters.rated4Plus && (item.rating ?? 0) < 4) return false;
      return true;
    },
    [filters],
  );

  const quantityFor = (foodItemId: string) =>
    cartItems.filter((i) => i.foodItemId === foodItemId).reduce((sum, i) => sum + i.quantity, 0);

  const visibleCategories = useMemo(() => {
    if (isSearch) return categories;
    return categories.filter((c) => menu.some((i) => i.categoryId === c.id && i.available && passesFilters(i)));
  }, [categories, menu, isSearch, passesFilters]);

  const visibleCountFor = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of categories) {
      map[c.id] = menu.filter((i) => i.categoryId === c.id && i.available && passesFilters(i)).length;
    }
    return map;
  }, [categories, menu, passesFilters]);

  const searchResults = useMemo(() => {
    if (!isSearch) return [];
    const q = menuSearch.trim().toLowerCase();
    return menu.filter((item) => item.name.toLowerCase().includes(q));
  }, [isSearch, menuSearch, menu]);

  const keyedActive = useMemo(() => activeCategory ?? visibleCategories[0]?.id ?? null, [activeCategory, visibleCategories]);

  const commitLine = (line: CartLineItem) => {
    if (!restaurant) return;
    const result = addItem(restaurant.id, restaurant.name, line);
    if (result.conflict && cartRestaurantName) {
      Alert.alert(
        "Start a new cart?",
        `Your cart contains items from ${cartRestaurantName}. Adding items from another restaurant will clear your current cart.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Start New Cart", style: "destructive", onPress: () => replaceCartWithItem(restaurant.id, restaurant.name, line) },
        ],
      );
      return;
    }
    setCustomizeItem(null);
  };

  const onAdd = (item: FoodItem) => {
    if (!restaurant?.isOpen) {
      Alert.alert("Restaurant closed", `${restaurant?.name ?? "This restaurant"} is not accepting orders right now.`);
      return;
    }
    if (item.variants?.length || item.addonGroups?.length) {
      setCustomizeItem(item);
      return;
    }
    const line: CartLineItem = {
      lineId: cartLineId(item.id),
      foodItemId: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      veg: item.veg,
      quantity: 1,
      unitPrice: item.price,
      lineTotal: item.price,
      selectedAddons: [],
    };
    commitLine(line);
  };

  const onIncrement = (item: FoodItem) => {
    if (!restaurant?.isOpen) {
      Alert.alert("Restaurant closed", `${restaurant?.name ?? "This restaurant"} is not accepting orders right now.`);
      return;
    }
    const hasChoices = Boolean(item.variants?.length || item.addonGroups?.length);
    if (hasChoices) {
      setCustomizeItem(item);
      return;
    }
    const lineId = cartLineId(item.id);
    const existing = cartItems.find((i) => i.lineId === lineId);
    if (existing) updateQty(lineId, 1);
    else onAdd(item);
  };

  const onDecrement = (item: FoodItem) => {
    const line = cartItems.find((i) => i.foodItemId === item.id);
    if (line) updateQty(line.lineId, -1);
  };

  const toggleFilter = (key: keyof MenuFilterState) => setFilters((f) => ({ ...f, [key]: !f[key] }));

  const onShare = async () => {
    if (!restaurant) return;
    const message = `${restaurant.name} — ${restaurant.cuisines.join(", ")} · ★ ${restaurant.rating.toFixed(1)} · ${restaurant.area} · on Goocart`;
    try {
      await Share.share({ message });
    } catch {
      // Native share unavailable (e.g. desktop/web) — gracefully fall back to
      // copying the restaurant details to the clipboard.
      if (Platform.OS === "web") {
        try {
          const clipboard = (navigator as { clipboard?: { writeText: (t: string) => Promise<void> } }).clipboard;
          await clipboard?.writeText(message);
          Alert.alert("Link copied", "Restaurant details copied to clipboard.");
        } catch {
          // Clipboard unavailable — nothing more we can do.
        }
      }
    }
  };

  const selectCategory = (catId: string) => {
    setActiveCategory(catId);
    const y = sectionOffsets.current[catId];
    if (y !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({ y: Math.max(0, y - STICKY_OFFSET), animated: true });
    }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    scrollY.setValue(y);
    setCollapsed(y >= inlineNavTop);
    if (isSearch) return;
    let current: string | null = null;
    for (const c of visibleCategories) {
      const off = sectionOffsets.current[c.id];
      if (off !== undefined && off <= y + STICKY_OFFSET) current = c.id;
      else break;
    }
    setActiveCategory((prev) => current ?? prev);
  };

  const compactOpacity = scrollY.interpolate({
    inputRange: [inlineNavTop - 60, inlineNavTop - 16],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // ---- Loading / error states ------------------------------------------------
  if (restaurant === undefined) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={{ padding: spacing.xl, gap: spacing.md, paddingTop: spacing.xxxl }}>
          <SkeletonBlock width="100%" height={220} />
          <SkeletonBlock width="60%" height={20} />
          <SkeletonBlock width="40%" height={14} />
          <SkeletonBlock width="100%" height={34} />
          <SkeletonBlock width="100%" height={70} />
          <SkeletonBlock width="100%" height={70} />
        </View>
      </SafeAreaView>
    );
  }

  if (restaurant === null) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <EmptyState
          icon="alert"
          title={loadError ? "Couldn’t load restaurant" : "Restaurant unavailable"}
          copy={loadError ?? "This restaurant could not be found. It may have been removed."}
        />
      </SafeAreaView>
    );
  }

  const showNav = !isSearch && visibleCategories.length > 1;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: totalItems > 0 ? 120 : spacing.xl }}
      >
        <RestaurantHeader
          scrollY={scrollY}
          collapseOffset={inlineNavTop}
          restaurant={restaurant}
          isFavorite={isFavorite}
          onToggleFavorite={() => toggleFavorite(restaurant.id)}
          onShare={onShare}
          onBack={() => router.back()}
        />

        <RestaurantInfo restaurant={restaurant} />
        <RestaurantOffers restaurant={restaurant} />

        <View style={styles.controls}>
          <MenuSearchBar value={menuSearch} onChangeText={setMenuSearch} />
          {!isSearch ? <MenuFilters filters={filters} onToggle={toggleFilter} /> : null}
        </View>

        {isSearch ? (
          <View style={styles.searchList}>
            {searchResults.length === 0 ? (
              <EmptyState icon="search" title="No dishes found" copy={`Nothing matches "${menuSearch.trim()}".`} />
            ) : (
              searchResults.map((item) => (
                <FoodItemCard
                  key={item.id}
                  item={item}
                  quantityInCart={quantityFor(item.id)}
                  onAdd={() => onAdd(item)}
                  onIncrement={() => onIncrement(item)}
                  onDecrement={() => onDecrement(item)}
                />
              ))
            )}
          </View>
        ) : (
          <>
            <View onLayout={(e) => setInlineNavTop(e.nativeEvent.layout.y)} style={styles.inlineNav}>
              <MenuCategoryNav categories={visibleCategories} activeKey={keyedActive} onSelect={selectCategory} counts={visibleCountFor} />
            </View>

            {visibleCategories.length === 0 ? (
              <EmptyState icon="menu" title="No dishes match" copy="Try changing the filters to see more items." />
            ) : (
              visibleCategories.map((cat) => (
                <MenuSection
                  key={cat.id}
                  title={cat.name}
                  items={menu.filter((i) => i.categoryId === cat.id && i.available && passesFilters(i))}
                  onLayoutY={(y) => {
                    sectionOffsets.current[cat.id] = y;
                  }}
                  quantityFor={quantityFor}
                  onAdd={onAdd}
                  onIncrement={onIncrement}
                  onDecrement={onDecrement}
                />
              ))
            )}
          </>
        )}
      </Animated.ScrollView>

      <Animated.View style={[styles.compactBar, { opacity: compactOpacity }]} pointerEvents={collapsed ? "box-none" : "none"}>
        <View style={styles.compactInner}>
          <Pressable onPress={() => router.back()} style={styles.compactBtnWrap} accessibilityLabel="Go back">
            <Icon name="back" size={20} color={colors.dark} />
          </Pressable>
          <View style={styles.compactTitleWrap}>
            <Animated.Text style={styles.compactTitle} numberOfLines={1}>
              {restaurant.name}
            </Animated.Text>
            <Animated.Text style={styles.compactSubtitle} numberOfLines={1}>
              ★ {restaurant.rating.toFixed(1)} · {restaurant.deliveryTimeMin}–{restaurant.deliveryTimeMax} min
            </Animated.Text>
          </View>
          <Pressable onPress={() => toggleFavorite(restaurant.id)} style={styles.compactBtnWrap} accessibilityLabel="Toggle favorite">
            <Icon name={isFavorite ? "heartFilled" : "heart"} size={18} color={isFavorite ? colors.error : colors.dark} />
          </Pressable>
        </View>
      </Animated.View>

      {showNav ? (
        <Animated.View style={[styles.floatingNav, { opacity: compactOpacity }]} pointerEvents={collapsed ? "box-none" : "none"}>
          <MenuCategoryNav categories={visibleCategories} activeKey={keyedActive} onSelect={selectCategory} counts={visibleCountFor} />
        </Animated.View>
      ) : null}

      {cartRestaurantId === restaurant.id ? (
        <StickyCartBar itemCount={totalItems} total={bill.itemTotal} onPress={() => router.push("/(tabs)/cart")} />
      ) : null}

      <CustomizeSheet item={customizeItem} visible={!!customizeItem} onClose={() => setCustomizeItem(null)} onConfirm={commitLine} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  controls: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, gap: spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  inlineNav: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchList: { paddingHorizontal: spacing.xl },
  compactBar: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 30, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  compactInner: { height: COMPACT_H, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md },
  compactBtnWrap: { width: 36, height: 36, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  compactTitleWrap: { flex: 1 },
  compactTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  compactSubtitle: { color: colors.muted, fontSize: 11, marginTop: 1 },
  floatingNav: { position: "absolute", top: COMPACT_H, left: 0, right: 0, zIndex: 29, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
});
