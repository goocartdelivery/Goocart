import { useEffect, useMemo, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useStoreCartBill, useStoreCartItemCount } from "@/store/useStoreCartStore";
import { colors, radius, spacing, typography } from "@/theme";

type Props = {
  bottomOffset?: number;
};

const ACCENT = "#16A34A";

export function GroceryStickyCartBar({ bottomOffset = 0 }: Props) {
  const count = useStoreCartItemCount();
  const bill = useStoreCartBill();

  const [prevCount, setPrevCount] = useState(count);
  const [anim] = useState(() => new Animated.Value(0));

  const visible = count > 0;

  useEffect(() => {
    const target = visible ? 1 : 0;
    Animated.timing(anim, { toValue: target, duration: 180, useNativeDriver: true }).start();
    setPrevCount(count);
  }, [visible, count, anim]);

  const animStyle = useMemo(
    () => ({
      opacity: anim,
      transform: [{ translateY: Animated.multiply(anim, -1).interpolate({ inputRange: [-1, 0], outputRange: [0, 20] }) }],
      pointerEvents: visible ? ("auto" as const) : ("none" as const),
    }),
    [anim, visible],
  );

  if (!visible && prevCount === 0) return null;

  return (
    <Animated.View
      style={[
        styles.wrap,
        animStyle,
        { bottom: bottomOffset },
      ]}
    >
      <View style={styles.inner}>
        <View style={styles.info}>
          <Text style={styles.count}>
            {count} item{count === 1 ? "" : "s"}
          </Text>
          <Text style={styles.total}>₹{bill.total}</Text>
        </View>
        <Pressable
          onPress={() => router.push("/(tabs)/cart")}
          accessibilityRole="button"
          style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
        >
          <Text style={styles.btnText}>VIEW CART</Text>
          <Text style={styles.btnArrow}>→</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.dark,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: colors.black,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  info: { gap: 1 },
  count: { ...typography.caption, color: "#A1A1AA", fontSize: 11, fontWeight: "600" },
  total: { color: colors.white, fontSize: 18, fontWeight: "800" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: ACCENT,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  pressed: { opacity: 0.88 },
  btnText: { color: colors.white, fontSize: 13, fontWeight: "800", letterSpacing: 0.3 },
  btnArrow: { color: colors.white, fontSize: 13, fontWeight: "800", marginLeft: 2 },
});
