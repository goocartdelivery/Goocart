import { useActiveServiceStore } from "@/store/useActiveServiceStore";
import { serviceConfig } from "@/constants/serviceHome";
import { CategoriesRow } from "@/components/home/CategoriesRow";
import { HomeCategory } from "@/constants/serviceHome";
import { colors, spacing } from "@/theme";
import { StyleSheet, View } from "react-native";

type Props = {
  selectedCategory: HomeCategory | null;
  onSelectCategory: (c: HomeCategory | null) => void;
};

// Sentinel key + "All" tile shown first in the subcategory row. Selecting it
// clears any subcategory filter so the full service listing is shown.
const ALL_KEY = "__all__";
const ALL_FOOD_IMAGE = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=220&h=220&q=65";

// The per-service subcategory strip that sticks below the fixed header while
// the main category tabs (ServiceTabs) and the content scroll away. It stays a
// direct child of the home ScrollView at a stable index so native sticky
// headers (stickyHeaderIndices) can pin it just under the header.
export function ServiceSubcategoryStrip({ selectedCategory, onSelectCategory }: Props) {
  const active = useActiveServiceStore((s) => s.active);
  const config = serviceConfig(active);

  // Job services (Bike Taxi / Parcel) have no categories. We still return a
  // View so the ScrollView's sticky index stays stable across services.
  if (config.categories.length === 0) return <View />;

  // "All" tile styled to match the service row (photo tile for Food, emoji
  // chip for product services) and placed at the very start.
  const allCategory: HomeCategory = {
    key: ALL_KEY,
    label: "All",
    keywords: [],
    ...(config.kind === "food"
      ? { imageUrl: ALL_FOOD_IMAGE }
      : { emoji: "🛒", accent: config.theme.primaryMuted }),
  };
  const categories = [allCategory, ...config.categories];

  // "All" is the active state whenever no subcategory is picked.
  const activeKey = selectedCategory?.key ?? ALL_KEY;

  const handleSelect = (c: HomeCategory | null) => {
    // Tapping "All" (or the already-selected item again) clears the filter.
    onSelectCategory(!c || c.key === ALL_KEY ? null : c);
  };

  return (
    <View style={styles.strip}>
      <CategoriesRow categories={categories} selectedKey={activeKey} onSelect={handleSelect} />
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
  },
});
