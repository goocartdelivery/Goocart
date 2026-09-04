import { ScrollView, StyleSheet } from "react-native";
import { colors, spacing } from "@/theme";
import { FilterChip } from "@/components/FilterChip";

export type MenuFilterState = {
  vegOnly: boolean;
  bestsellerOnly: boolean;
  rated4Plus: boolean;
};

export function MenuFilters({
  filters,
  onToggle,
}: {
  filters: MenuFilterState;
  onToggle: (key: keyof MenuFilterState) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <FilterChip label="Veg" active={filters.vegOnly} onPress={() => onToggle("vegOnly")} />
      <FilterChip label="Bestseller" active={filters.bestsellerOnly} onPress={() => onToggle("bestsellerOnly")} />
      <FilterChip label="Rating" active={filters.rated4Plus} onPress={() => onToggle("rated4Plus")} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, backgroundColor: colors.surface },
});
