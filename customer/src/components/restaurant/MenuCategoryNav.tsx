import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { MenuCategory } from "@/types";
import { colors, radius, spacing, typography } from "@/theme";

// Horizontal category chips. Rendered both inline (in the scroll content,
// where it is measured for sticky offset) and as a floating overlay bar. The
// active chip is highlighted and auto-behaved by the parent.
export function MenuCategoryNav({
  categories,
  activeKey,
  onSelect,
  counts,
}: {
  categories: MenuCategory[];
  activeKey: string | null;
  onSelect: (categoryId: string) => void;
  counts?: Record<string, number>;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {categories.map((cat) => {
        const active = activeKey === cat.id;
        return (
          <Pressable key={cat.id} onPress={() => onSelect(cat.id)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.text, active && styles.textActive]}>{cat.name}</Text>
            {counts && counts[cat.id] !== undefined ? (
              <Text style={[styles.count, active && styles.textActive]}>{counts[cat.id]}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, alignItems: "center" },
  chip: {
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    justifyContent: "center",
  },
  chipActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  text: { ...typography.captionStrong, color: colors.text },
  textActive: { color: colors.white },
  count: { ...typography.caption, color: colors.muted, fontSize: 11 },
});
