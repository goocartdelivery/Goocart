import { useEffect, useMemo, useRef, useState } from "react";
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

export type ServiceTabsLayoutInfo = { type: string; x: number; width: number };

type Props = {
  onLayoutInfo?: (info: ServiceTabsLayoutInfo[]) => void;
  pillTranslateX?: Animated.Value;
  onScrollX?: Animated.Value;
};

// The colored "active" pill slides between tabs instead of teleporting. Tab
// x-positions are measured with onLayout (not hardcoded), so the pill tracks
// the right tab on every screen size — including when the row scrolls.
// If pillTranslateX is supplied from the parent (HomeScreen), we use that
// same Animated.Value so an external bridge/connection shape can track the
// exact same motion. Otherwise we fall back to a local value.
// onScrollX mirrors the row's horizontal scroll offset (content-space), so the
// parent can keep its header→tab connection glued to the pill when the row
// scrolls on narrow screens. We also auto-scroll the active tab fully into
// view so the connection never dangles off-screen.
export function ServiceTabs({ onLayoutInfo, pillTranslateX: externalX, onScrollX: externalScrollX }: Props = {}) {
  const active = useActiveServiceStore((s) => s.active);
  const setActive = useActiveServiceStore((s) => s.setActive);
  const theme = serviceConfig(active).theme;

  const [tabX, setTabX] = useState<Record<string, number>>({});
  const [tabW, setTabW] = useState<number>(76);
  const [localX] = useState(() => new Animated.Value(0));
  const translateX = externalX ?? localX;
  const [localScrollX] = useState(() => new Animated.Value(0));
  const scrollX = externalScrollX ?? localScrollX;
  const initialized = useRef(false);
  const reportedRef = useRef<string>("");

  const [viewportW, setViewportW] = useState(0);
  const [contentW, setContentW] = useState(0);
  const currentScroll = useRef(0);
  const scrollRef = useRef<ScrollView>(null);

  const scrollEvent = useMemo(
    () =>
      // The listener below only runs when a native scroll event fires (never
      // during render), so tracking the offset in a ref here is intentionally
      // safe; the rule cannot tell render-time from event-time access.
      // JS driver (not native): this value feeds the header→tab connection
      // which also animates colors/opacity on the JS thread, and React Native
      // forbids mixing native + JS consumers of the same animated node.
      // eslint-disable-next-line react-hooks/refs
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: false,
        listener: (event: { nativeEvent: { contentOffset: { x: number } } }) => {
          currentScroll.current = event?.nativeEvent?.contentOffset?.x ?? 0;
        },
      }),
    // scrollX is a stable Animated.Value; the event is built once.
    [scrollX],
  );

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
      useNativeDriver: false,
      damping: 18,
      stiffness: 190,
      mass: 0.6,
    }).start();
  }, [active, tabX, translateX]);

  // Keep the active tab fully visible so the header connection stays on-screen:
  // scroll the row only when the tab is clipped (never on a simple tap that
  // leaves it visible, and never toward the past the row's boundaries).
  useEffect(() => {
    const plannedX = tabX[active];
    if (plannedX === undefined || viewportW <= 0) return;
    const maxScroll = Math.max(0, contentW - viewportW);
    const visiblePad = 24;
    const cur = currentScroll.current;
    const cutRight = plannedX + tabW > cur + viewportW - visiblePad;
    if (cutRight) {
      scrollRef.current?.scrollTo({ x: Math.min(plannedX + tabW + visiblePad - viewportW, maxScroll), animated: true });
    } else if (plannedX < cur + visiblePad) {
      scrollRef.current?.scrollTo({ x: Math.max(plannedX - visiblePad, 0), animated: true });
    }
  }, [active, tabX, tabW, viewportW, contentW]);

  const onLayoutTab = (type: string) => (e: { nativeEvent: { layout: { x: number; width: number } } }) => {
    const { x, width } = e.nativeEvent.layout;
    const tabChanged = width !== tabW;
    const prevX = tabX[type];
    if (tabChanged) setTabW(width);
    setTabX((prev) => (prev[type] === x ? prev : { ...prev, [type]: x }));
    if (onLayoutInfo) {
      const next: ServiceTabsLayoutInfo[] = Object.entries({ ...tabX, [type]: x }).map(([t, xx]) => {
        const w = t === type ? width : tabW;
        return { type: t, x: xx ?? 0, width: w };
      });
      const sig = next.map((n) => `${n.type}:${n.x.toFixed(0)}x${n.width.toFixed(0)}`).join("|");
      if (sig !== reportedRef.current) {
        reportedRef.current = sig;
        onLayoutInfo(next);
      }
    }
    // void usage to avoid unused lint when prevX used / not used
    void prevX;
  };

  return (
    <Animated.ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.wrap}
      style={styles.tabsScroll}
      onScroll={scrollEvent}
      scrollEventThrottle={16}
      onLayout={(e) => setViewportW(e.nativeEvent.layout.width)}
      onContentSizeChange={(w) => setContentW(w)}
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
    </Animated.ScrollView>
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
