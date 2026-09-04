import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { radius, spacing, typography } from "@/theme";
import { ServiceConfig } from "@/constants/serviceHome";

// Full-width promotional banner.  The image stretches edge-to-edge and
// the kicker / title / subtitle / CTA sit as a left-aligned overlay.
// Tabs and search are rendered OUTSIDE this component (home.tsx).
type Props = {
  config: ServiceConfig;
  onCta?: () => void;
};

export function WavyHero({ config, onCta }: Props) {
  const { width } = useWindowDimensions();
  const { theme, hero } = config;
  const hasImage = Boolean(hero.image);
  const bannerHeight = Math.round(width * 0.46);

  return (
    <View style={styles.hero}>
      {/* Full-bleed background */}
      {hasImage ? (
        <Image source={hero.image!} style={[styles.bgImage, { height: bannerHeight }]} contentFit="cover" />
      ) : (
        <View style={[styles.gradientFallback, { height: bannerHeight, backgroundColor: theme.gradientDeep }]}>
          <View style={[styles.gradientTop, { backgroundColor: theme.gradient[0] }]} />
          <View style={styles.emojiFallbackWrap}>
            <View
              style={[
                styles.emojiRingLarge,
                { borderColor: `${theme.onPrimary}55`, backgroundColor: "rgba(255,255,255,0.16)" },
              ]}
            >
              <Text style={styles.emojiLarge}>{hero.emoji}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Left-aligned text overlay */}
      <View style={[styles.body, { height: bannerHeight }]}>
        <View style={styles.copy}>
          <View style={styles.kickerRow}>
            <View style={[styles.kickerDot, { backgroundColor: theme.accent }]} />
            <Text style={styles.kicker}>{hero.kicker}</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {hero.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {hero.subtitle}
          </Text>
          <Pressable
            onPress={onCta}
            accessibilityRole="button"
            style={[styles.cta, { backgroundColor: theme.accent }]}
          >
            <Text style={[styles.ctaText, { color: theme.gradientDeep }]}>{hero.ctaLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: "100%",
    overflow: "hidden",
  },
  bgImage: {
    width: "100%",
  },
  gradientFallback: {
    width: "100%",
  },
  gradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "62%",
    borderBottomStartRadius: 120,
    borderBottomEndRadius: 80,
  },
  emojiFallbackWrap: {
    position: "absolute",
    right: 24,
    top: "35%",
  },
  emojiRingLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  emojiLarge: { fontSize: 42 },
  body: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  copy: {
    width: "52%",
    gap: 6,
  },
  kickerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  kickerDot: { width: 7, height: 7, borderRadius: 4 },
  kicker: {
    ...typography.captionStrong,
    color: "#FFFFFF",
    fontSize: 10,
    letterSpacing: 0.8,
  },
  title: {
    ...typography.h1,
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 28,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 2 },
  },
  subtitle: {
    ...typography.body,
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 17,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  cta: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  ctaText: { fontSize: 12, fontWeight: "800" },
});
