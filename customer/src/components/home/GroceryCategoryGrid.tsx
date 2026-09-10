import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SkeletonBlock } from "@/components/SkeletonBlock";
import { HomeCategory } from "@/constants/serviceHome";
import { colors, radius, spacing, typography } from "@/theme";

type Props = {
  categories: HomeCategory[];
  loading: boolean;
  onSelectCategory?: (c: HomeCategory) => void;
};

const COLS = 3;
const GUTTER = spacing.sm;
const H_PAD = spacing.lg;
const TARGET_HEIGHT = 84;

export function GroceryCategoryGrid({ categories, loading, onSelectCategory }: Props) {
  const { width } = useWindowDimensions();
  const usable = Math.min(width, 560) - H_PAD * 2;
  const cardWidth = Math.floor((usable - GUTTER * (COLS - 1)) / COLS);

  if (loading) {
    const items = Array.from({ length: 9 });
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Shop by Category</Text>
        <View style={[styles.grid, { paddingHorizontal: H_PAD }]}>
          {items.map((_, i) => (
            <View key={i} style={{ width: cardWidth, height: TARGET_HEIGHT, marginBottom: GUTTER }}>
              <SkeletonBlock width="100%" height={TARGET_HEIGHT} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (categories.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Shop by Category</Text>
      <View style={[styles.grid, { paddingHorizontal: H_PAD }]}>
        {categories.map((c) => {
          const bg = c.accent || colors.surface;
          return (
            <Pressable
              key={c.key}
              onPress={() => onSelectCategory?.(c)}
              accessibilityRole="button"
              accessibilityLabel={`Shop ${c.label}`}
              style={({ pressed }) => [
                styles.card,
                { width: cardWidth, height: TARGET_HEIGHT, backgroundColor: bg, marginBottom: GUTTER },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.iconWrap}>
                {c.image ? (
                  <Image source={c.image} style={styles.catImage} resizeMode="contain" />
                ) : (
                  <Text style={styles.emoji}>{c.emoji ?? "🛒"}</Text>
                )}
              </View>
              <Text style={styles.label} numberOfLines={2}>
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  title: {
    ...typography.h2,
    fontSize: 18,
    paddingHorizontal: H_PAD,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: GUTTER,
  },
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 6,
    gap: 4,
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  catImage: { width: 42, height: 42 },
  emoji: { fontSize: 26, lineHeight: 30 },
  label: {
    ...typography.captionStrong,
    color: colors.dark,
    fontSize: 11.5,
    textAlign: "center",
    lineHeight: 14,
  },
});
