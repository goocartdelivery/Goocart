import { useEffect, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, Text, Pressable, View } from "react-native";
import { Image } from "expo-image";
import { useActiveServiceStore } from "@/store/useActiveServiceStore";
import { serviceConfig } from "@/constants/serviceHome";
import { SERVICES } from "@/constants/services";
import { colors, radius, spacing, typography } from "@/theme";

// Large category selector shown ABOVE the banner. Tapping a tab updates the
// single activeService store — the whole homepage reacts to it, no navigation,
// no page reload.  Placed outside WavyHero so it never overlaps the banner.
const SERVICE_EMOJIS: Record<string, string> = {
  FOOD: "🍔",
  GROCERY: "🛒",
  VEGETABLES: "🥬",
  MART: "🛍️",
  BIKE_TAXI: "🛵",
  PARCEL: "📦",
};

// The colored "active" pill slides between tabs instead of teleporting. Tab
// x-positions are measured with onLayout (not hardcoded), so the pill tracks
// the right tab on every screen size — including when the row scrolls.
export function ServiceTabs() {
  const active = useActiveServiceStore((s) => s.active);
  const setActive = useActiveServiceStore((s) => s.setActive);
  const theme = serviceConfig(active).theme;

  const [tabX, setTabX] = useState<Record<string, number>>({});
  const [tabW, setTabW] = useState<number>(76);
  // Stable Animated.Value; animations are driven from effects/handlers only.
  const [translateX] = useState(() => new Animated.Value(0));
  const initialized = useRef(false);

  useEffect(() => {
    const x = tabX[active];
    if (x === undefined) return;
    if (!initialized.current) {
      initialized.current = true;
      translateX.setValue(x);
      return;
    }
    Animated.spring(translateX, {
      toValue: x,
      useNativeDriver: true,
      damping: 18,
      stiffness: 190,
      mass: 0.6,
    }).start();
  }, [active, tabX, translateX]);

  const onLayoutTab = (type: string) => (e: { nativeEvent: { layout: { x: number; width: number } } }) => {
    const { x, width } = e.nativeEvent.layout;
    if (width !== tabW) setTabW(width);
    setTabX((prev) => (prev[type] === x ? prev : { ...prev, [type]: x }));
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.wrap}
      style={styles.tabsScroll}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.pill,
          { width: tabW, height: 80, backgroundColor: theme.primary, transform: [{ translateX }] },
        ]}
      />

      {SERVICES.map((s) => {
        const isActive = s.type === active;
        return (
          <Pressable
            key={s.type}
            onPress={() => setActive(s.type)}
            onLayout={onLayoutTab(s.type)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={[
              styles.tab,
              isActive ? styles.tabActive : styles.tabInactive,
            ]}
          >
            <View style={styles.iconCircle}>
              {s.type === "FOOD" ? (
                <Image source={require("../../../assets/images/beef.webp")} style={styles.iconImage} contentFit="cover" />
              ) : (
                <Text style={styles.emoji}>{SERVICE_EMOJIS[s.type] ?? "📦"}</Text>
              )}
            </View>
            <Text
              style={[styles.label, { color: isActive ? colors.white : colors.text }]}
              numberOfLines={1}
            >
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabsScroll: {
    height: 104,
  },
  wrap: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    position: "relative",
  },
  pill: {
    position: "absolute",
    left: 0,
    top: spacing.md,
    width: 76,
    height: 80,
    borderRadius: radius.lg,
    overflow: "hidden",
    zIndex: 0,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: 76,
    height: 80,
    borderRadius: radius.lg,
    zIndex: 1,
  },
  tabActive: {
    backgroundColor: "transparent",
  },
  tabInactive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 24 },
  iconImage: { width: 44, height: 44, borderRadius: 22 },
  label: { ...typography.captionStrong, fontSize: 11, textAlign: "center" },
});
