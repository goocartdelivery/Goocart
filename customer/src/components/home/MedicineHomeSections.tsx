import { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { GroceryCategoryGrid } from "@/components/home/GroceryCategoryGrid";
import { GroceryHorizontalCarousel } from "@/components/home/GroceryHorizontalCarousel";
import { BrandsSection } from "@/components/home/BrandsSection";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { HOME_RAW_CATEGORIES, HomeCategory, serviceConfig } from "@/constants/serviceHome";
import { matchesCategory, useServiceHomeStore, useServiceProducts } from "@/store/useServiceHomeStore";
import { useCategorySelectionStore } from "@/store/useCategorySelectionStore";
import { ServiceProduct } from "@/services/ServiceOrderService";
import { colors, radius, spacing, typography } from "@/theme";

type Props = {
  selectedCategory: HomeCategory | null;
};

const SERVICE = "MEDICINE";

function categoryKeywords(...keys: string[]): string[] {
  const medicineCats = HOME_RAW_CATEGORIES.medicine;
  const out: string[] = [];
  for (const k of keys) {
    const c = medicineCats.find((x) => x.key === k);
    if (c) out.push(...c.keywords);
  }
  return out;
}

const PAIN_COLD_KW = categoryKeywords("pain-relief", "cold-flu");
const VITAMIN_DIABETES_KW = categoryKeywords("vitamins-supplements", "diabetes-care");
const DEVICES_FIRST_AID_KW = categoryKeywords("healthcare-devices", "first-aid");

function byRatingDesc(a: ServiceProduct, b: ServiceProduct) {
  return (b.rating || 0) - (a.rating || 0);
}

export function MedicineHomeSections({ selectedCategory: _selectedCategory }: Props) {
  const products = useServiceProducts(SERVICE);
  const state = useServiceHomeStore((s) => s.productsState[SERVICE] ?? "idle");
  const errorMessage = useServiceHomeStore((s) => s.productsError[SERVICE]);
  const loadProducts = useServiceHomeStore((s) => s.loadProducts);
  const setCategory = useCategorySelectionStore((s) => s.setCategory);

  useEffect(() => {
    void loadProducts(SERVICE);
  }, [loadProducts]);

  const loading = state === "idle" || state === "loading";
  const error = state === "error";
  const loaded = state === "loaded";

  const painCold = useMemo(
    () => products.filter((p) => matchesCategory(p, PAIN_COLD_KW)),
    [products],
  );
  const vitaminsDiabetes = useMemo(
    () => products.filter((p) => matchesCategory(p, VITAMIN_DIABETES_KW)),
    [products],
  );
  const devicesFirstAid = useMemo(
    () => products.filter((p) => matchesCategory(p, DEVICES_FIRST_AID_KW)),
    [products],
  );
  const popularMedicines = useMemo(() => {
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
        <Text style={typography.bodyStrong}>Couldn\u2019t load medicine products</Text>
        {errorMessage ? <Text style={styles.errorDetail}>{errorMessage}</Text> : null}
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
          icon="medical"
          title="No medicine items yet"
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

      <View style={styles.trustCard}>
        <View style={styles.trustEmoji}>
          <Icon name="medical" size={22} color={colors.white} />
        </View>
        <View style={styles.trustBody}>
          <Text style={styles.trustTitle}>Genuine medicines, safely delivered</Text>
          <Text style={styles.trustCopy}>
            Partnered pharmacies and quality-checked storage. Prescription medicines are delivered only against a valid prescription.
          </Text>
        </View>
      </View>

      <GroceryHorizontalCarousel
        title="Popular Medicines"
        products={popularMedicines}
        loading={loading}
        accent={config.theme.primary}
        onViewAll={handleViewAll}
      />

      <GroceryHorizontalCarousel
        title="Pain Relief & Cold & Flu"
        products={painCold}
        loading={loading}
        accent={config.theme.primary}
        onViewAll={handleViewAll}
      />

      <GroceryHorizontalCarousel
        title="Health & Wellness"
        products={vitaminsDiabetes}
        loading={loading}
        accent={config.theme.primary}
        onViewAll={handleViewAll}
      />

      <GroceryHorizontalCarousel
        title="Devices & First Aid"
        products={devicesFirstAid}
        loading={loading}
        accent={config.theme.primary}
        onViewAll={handleViewAll}
      />

      <View style={styles.brandsWrap}>
        <Text style={styles.brandsTitle}>Top medicine brands</Text>
        <BrandsSection brands={config.brands} service={config.type} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg },
  trustCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    backgroundColor: "#E6F7F1",
    borderWidth: 1,
    borderColor: "#C3EBDC",
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  trustEmoji: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0E9F6E",
    alignItems: "center",
    justifyContent: "center",
  },
  trustBody: { flex: 1, gap: 2 },
  trustTitle: { ...typography.bodyStrong, color: "#0B6E4E" },
  trustCopy: { ...typography.caption, fontSize: 11, color: "#396053", lineHeight: 16 },
  brandsWrap: { gap: spacing.md },
  brandsTitle: { ...typography.h2, paddingHorizontal: spacing.lg },
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
});