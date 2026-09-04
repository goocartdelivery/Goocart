import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { ServiceBrand } from "@/constants/serviceHome";
import { colors, spacing, typography } from "@/theme";
import { ServiceType } from "@/types";

type Props = { brands: ServiceBrand[]; service: ServiceType };

export function BrandsSection({ brands, service }: Props) {
  if (!brands.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.wrap}>
      {brands.map((b) => (
        <Pressable
          key={b.name}
          accessibilityRole="button"
          accessibilityLabel={b.name}
          style={styles.item}
          onPress={() => router.push({ pathname: "/service/[type]", params: { type: service } })}
        >
          <View style={[styles.circle, b.image ? styles.circleImage : { backgroundColor: `${b.color}18`, borderColor: `${b.color}40` }]}>
            {b.image ? (
              <Image source={b.image} style={styles.brandImage} contentFit="cover" transition={200} />
            ) : (
              <Text style={styles.emoji}>{b.emoji}</Text>
            )}
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {b.name}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xl, paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  item: { alignItems: "center", gap: spacing.sm, width: 78 },
  circle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  circleImage: {
    borderWidth: 0,
  },
  brandImage: { width: "100%", height: "100%" },
  emoji: { fontSize: 32 },
  name: { ...typography.caption, fontSize: 11, color: colors.dark, fontWeight: "700", textAlign: "center" },
});