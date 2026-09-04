import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Restaurant } from "@/types";
import { colors, radius, spacing, typography } from "@/theme";
import { RemoteImage } from "@/components/RemoteImage";
import { Icon } from "@/components/Icon";

type Props = {
  scrollY: Animated.Value;
  collapseOffset: number;
  restaurant: Restaurant;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
  onBack: () => void;
};

// Hero banner (scrolls away with content) with a subtle parallax and floating
// back / favorite / share controls over the image. The collapsing compact bar
// lives at the screen level, driven by the same scrollY, so it truly sticks.
export function RestaurantHeader({ scrollY, collapseOffset, restaurant, isFavorite, onToggleFavorite, onShare, onBack }: Props) {
  const heroScale = scrollY.interpolate({
    inputRange: [-120, 0, collapseOffset > 0 ? collapseOffset : 240],
    outputRange: [1.2, 1, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.hero, { transform: [{ scale: heroScale }] }]}>
        <RemoteImage uri={restaurant.imageUrl} fallbackLabel={restaurant.name} style={styles.heroImg} />
        <View style={styles.heroScrim} />
      </Animated.View>

      <View style={styles.heroTitleWrap} pointerEvents="none">
        <Text style={styles.heroTitle} numberOfLines={2}>
          {restaurant.name}
        </Text>
        {restaurant.isOpen ? null : <Text style={styles.closedTag}>CLOSED NOW</Text>}
      </View>

      {/* Floating controls on the hero */}
      <View style={styles.heroControls}>
        <Pressable onPress={onBack} style={styles.floatBtn} accessibilityLabel="Go back">
          <Icon name="back" size={20} color={colors.white} />
        </Pressable>
        <View style={styles.heroControlsRight}>
          <Pressable onPress={onShare} style={styles.floatBtn} accessibilityLabel="Share restaurant">
            <Icon name="share" size={18} color={colors.white} />
          </Pressable>
          <Pressable onPress={onToggleFavorite} style={styles.floatBtn} accessibilityLabel="Toggle favorite">
            <Icon name={isFavorite ? "heartFilled" : "heart"} size={18} color={isFavorite ? colors.error : colors.white} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative" },
  hero: {
    height: 260,
    width: "100%",
    overflow: "hidden",
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    backgroundColor: colors.primaryMuted,
  },
  heroImg: { width: "100%", height: "100%" },
  heroScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.3)" },
  heroControls: {
    position: "absolute",
    top: spacing.sm,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
  },
  heroControlsRight: { flexDirection: "row", gap: spacing.sm },
  floatBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitleWrap: { position: "absolute", left: spacing.lg, right: spacing.lg, bottom: spacing.lg },
  heroTitle: { ...typography.h1, color: colors.white, textShadowColor: "rgba(0,0,0,0.4)", textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },
  closedTag: { color: colors.white, fontSize: 11, fontWeight: "800", letterSpacing: 0.5, marginTop: 6, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm, backgroundColor: "rgba(0,0,0,0.5)" },
});
