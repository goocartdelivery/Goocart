import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { HomeCategory } from "@/constants/serviceHome";
import { colors, spacing, typography } from "@/theme";
import { RemoteImage } from "@/components/RemoteImage";

// Service category strip. Food uses photo tiles (the app's existing category
// imagery); product services (grocery/veg/mart) use emoji chips bound to the
// active service theme. Tapping a category filters the products below it.
type Props = {
  categories: HomeCategory[];
  selectedKey?: string | null;
  onSelect: (category: HomeCategory | null) => void;
};

export function CategoriesRow({ categories, selectedKey, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.wrap}>
      {categories.map((c) => {
        const selected = selectedKey === c.key;
        return (
          <Pressable
            key={c.key}
            onPress={() => onSelect(selected ? null : c)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={styles.item}
          >
            {c.imageUrl ? (
              <View style={[styles.photoWrap, selected && styles.selectedRing]}>
                <RemoteImage uri={c.imageUrl} fallbackLabel={c.label} style={styles.photo} />
                {selected ? <View style={styles.selectedCheck} /> : null}
              </View>
            ) : (
              <View style={[styles.emojiChip, { backgroundColor: selected ? c.accent ?? colors.primaryMuted : colors.surface }, selected && styles.selectedBorder]}>
                <Text style={styles.emoji}>{c.emoji ?? "🍎"}</Text>
                {selected ? <Text style={[styles.selectedDot]} /> : null}
              </View>
            )}
            <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
              {c.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md, paddingHorizontal: spacing.lg },
  item: { alignItems: "center", gap: 5, width: 68 },
  photoWrap: {
    width: 62,
    height: 62,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  photo: { width: "100%", height: "100%" },
  selectedRing: { borderColor: colors.primary },
  selectedCheck: {
    position: "absolute",
    right: 4,
    top: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
  },
  emojiChip: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedBorder: { borderColor: colors.primary },
  emoji: { fontSize: 26 },
  selectedDot: {
    position: "absolute",
    right: 6,
    top: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  label: { ...typography.caption, fontSize: 10.5, color: colors.text, textAlign: "center" },
  labelSelected: { color: colors.primary, fontWeight: "800" },
});