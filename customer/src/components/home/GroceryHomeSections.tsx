import { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { GroceryCategoryGrid } from "@/components/home/GroceryCategoryGrid";
import { GroceryHorizontalCarousel } from "@/components/home/GroceryHorizontalCarousel";
import { EmptyState } from "@/components/EmptyState";
import { HOME_RAW_CATEGORIES, HomeCategory, serviceConfig } from "@/constants/serviceHome";
import { matchesCategory, useServiceHomeStore, useServiceProducts } from "@/store/useServiceHomeStore";
import { useCategorySelectionStore } from "@/store/useCategorySelectionStore";
import { ServiceProduct } from "@/services/ServiceOrderService";
import { colors, radius, spacing, typography } from "@/theme";

type Props = {
  selectedCategory: HomeCategory | null;
};

const SERVICE = "GROCERY";
const DAILY_ESSENTIALS = ["milk", "bread", "egg", "butter", "curd", "atta", "rice", "oil", "sugar", "salt"];

function categoryKeywords(...keys: string[]): string[] {
  const groceryCats = HOME_RAW_CATEGORIES.grocery;
  const out: string[] = [];
  for (const k of keys) {
    const c = groceryCats.find((x) => x.key === k);
    if (c) out.push(...c.keywords);
  }
  return out;
}

const FRESH_PRODUCE_KW = categoryKeywords("fruits", "vegetables");
const SNACKS_KW = categoryKeywords("snacks", "biscuits", "beverages");

function byRatingDesc(a: ServiceProduct, b: ServiceProduct) {
  return (b.rating || 0) - (a.rating || 0);
}

export function GroceryHomeSections({ selectedCategory: _selectedCategory }: Props) {
  const products = useServiceProducts(SERVICE);
  const state = useServiceHomeStore((s) => s.productsState[SERVICE] ?? "idle");
  const loadProducts = useServiceHomeStore((s) => s.loadProducts);
  const setCategory = useCategorySelectionStore((s) => s.setCategory);

  useEffect(() => {
    void loadProducts(SERVICE);
  }, [loadProducts]);

  const loading = state === "idle" || state === "loading";
  const error = state === "error";
  const loaded = state === "loaded";

  const dailyEssentials = useMemo(
    () => products.filter((p) => matchesCategory(p, DAILY_ESSENTIALS)),
    [products],
  );
  const freshProduce = useMemo(
    () => products.filter((p) => matchesCategory(p, FRESH_PRODUCE_KW)),
    [products],
  );
  const snacksBeverages = useMemo(
    () => products.filter((p) => matchesCategory(p, SNACKS_KW)),
    [products],
  );
  const bestDeals = useMemo(() => {
    const sorted = [...products].sort(byRatingDesc);
    return sorted.slice(0, 10);
  }, [products]);
  const popularNearYou = useMemo(() => {
    const sorted = [...products].sort(byRatingDesc);
    return sorted.slice(0, 12);
  }, [products]);

  const config = serviceConfig(SERVICE);

  const handleSelectCategory = (c: HomeCategory) => {
    setCategory(SERVICE, c);
    router.push({ pathname: "/service/[type]", params: { type: SERVICE } });
  };

  const handleViewAll = () => {
    router.push({ pathname: "/service/[type]", params: { type: SERVICE } });
  };

  if (error) {
    return (
      <View style={styles.errorCard}>
        <Text style={typography.bodyStrong}>Couldn\u2019t load grocery products</Text>
        <Pressable onPress={() => void loadProducts(SERVICE, true)} accessibilityRole="button">
          <Text style={styles.retry}>Tap to retry</Text>
        </Pressable>
      </View>
    );
  }

  if (loaded && products.length === 0) {
    return (
      <View style={{ paddingHorizontal: spacing.lg }}>
        <EmptyState
          icon="grocery"
          title="No grocery items yet"
          copy="Live products and stock are added by admin. Check back soon."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GroceryCategoryGrid
        categories={config.categories}
        loading={loading}
        onSelectCategory={handleSelectCategory}
      />

      <GroceryHorizontalCarousel
        title="Best Deals"
        products={bestDeals}
        loading={loading}
        accent={config.theme.primary}
        onViewAll={handleViewAll}
      />

      <GroceryHorizontalCarousel
        title="Daily Essentials"
        products={dailyEssentials}
        loading={loading}
        accent={config.theme.primary}
        onViewAll={handleViewAll}
      />

      <GroceryHorizontalCarousel
        title="Fresh Fruits & Vegetables"
        products={freshProduce}
        loading={loading}
        accent={config.theme.primary}
        onViewAll={handleViewAll}
      />

      <GroceryHorizontalCarousel
        title="Snacks & Beverages"
        products={snacksBeverages}
        loading={loading}
        accent={config.theme.primary}
        onViewAll={handleViewAll}
      />

      <GroceryHorizontalCarousel
        title="Popular Near You"
        products={popularNearYou}
        loading={loading}
        accent={config.theme.primary}
        onViewAll={handleViewAll}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg },
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
});
