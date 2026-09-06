import { useEffect, useMemo, useState } from "react";
import { Animated, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, typography } from "@/theme";

export type SegmentOption<T extends string> = { key: T; label: string };

type Props<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (key: T) => void;
};

// Refined segmented control: plain text tabs with a sliding hairline underline.
// No pill boxes, no fill states — a mature, quiet navigation pattern. The
// underline animates to the selected tab using measured widths.
export function OrderSegmented<T extends string>({ options, value, onChange }: Props<T>) {
  const [widths, setWidths] = useState<number[]>([]);
  const [tabX, setTabX] = useState<number[]>([]);
  const translateX = useMemo(() => new Animated.Value(0), []);
  const selectedIndex = Math.max(0, options.findIndex((o) => o.key === value));

  useEffect(() => {
    const x = tabX[selectedIndex] ?? 0;
    Animated.timing(translateX, { toValue: x, duration: 220, useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, tabX.length]);

  const onLayout = (i: number) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setTabX((prev) => {
      const next = [...prev];
      next[i] = x;
      return next;
    });
    setWidths((prev) => {
      const next = [...prev];
      next[i] = width;
      return next;
    });
  };

  const activeWidth = widths[selectedIndex] ?? 0;

  return (
    <View style={styles.row} accessibilityRole="tablist">
      {options.map((o, i) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.key)}
            onLayout={onLayout(i)}
            style={styles.tab}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
      <Animated.View style={[styles.indicator, { width: activeWidth, transform: [{ translateX }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: "relative",
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 11 },
  label: { ...typography.body, color: colors.muted, fontWeight: "600" },
  labelActive: { color: colors.text, fontWeight: "800" },
  indicator: {
    position: "absolute",
    bottom: 0,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
});
