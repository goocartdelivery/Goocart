import { useEffect, useMemo } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useActiveOrders, ActiveOrder } from "@/orders/useActiveOrders";
import { foodEtaRemaining, orderStatusLabel } from "@/orders/orderStatus";
import { colors, radius, spacing, typography } from "@/theme";
import { Icon } from "@/components/Icon";
import { FoodOrder } from "@/types";
import { ServiceOrder } from "@/services/ServiceOrderService";

type Props = {
  bottomOffset: number;
};

// Compact, native-feeling floating active-order bar shown just above the bottom
// navigation on every tab. Two quiet lines: live ETA (backend-derived) and the
// merchant + status. Fades in smoothly; disappears whenever no order is live.
export function ActiveOrderBar({ bottomOffset }: Props) {
  const { activeOrders, hasActive, loading } = useActiveOrders();
  const progress = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [progress]);

  if (!hasActive && loading) return null;
  if (!hasActive) return null;

  const entry = activeOrders[0];
  const extraCount = activeOrders.length - 1;

  return (
    <Animated.View style={[styles.wrap, { bottom: bottomOffset, opacity: progress, transform: [{ translateY: Animated.multiply(progress, -1).interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        onPress={() => open(entry)}
        style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
      >
        <LiveDot color={entry.kind === "food" ? colors.primary : colors.success} />
        <View style={{ flex: 1, gap: 1 }}>
          <Text style={styles.eta} numberOfLines={1}>
            {etaLine(entry)}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {placeLine(entry)}
            {extraCount > 0 ? ` · +${extraCount} more` : ""}
          </Text>
        </View>
        <Icon name="forward" size={16} color={colors.white} />
      </Pressable>
    </Animated.View>
  );
}

function open(entry: ActiveOrder) {
  if (entry.kind === "food") router.push({ pathname: "/orders/[id]", params: { id: entry.order.id } });
  else router.push({ pathname: "/service-orders/[id]", params: { id: entry.order.id } });
}

function etaLine(entry: ActiveOrder): string {
  if (entry.kind === "food") {
    const eta = foodEtaRemaining(entry.order as FoodOrder);
    return eta !== null && eta > 0 ? `Order arriving in ${eta} min` : orderStatusLabel(entry.order.status);
  }
  return orderStatusLabel(entry.order.status);
}

function placeLine(entry: ActiveOrder): string {
  const name = entry.kind === "food" ? (entry.order as FoodOrder).restaurantName : (entry.order as ServiceOrder).vendorName || (entry.order as ServiceOrder).service;
  return `${name} • ${orderStatusLabel(entry.order.status)}`;
}

function LiveDot({ color }: { color: string }) {
  const opacity = useMemo(() => new Animated.Value(0.5), []);
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[styles.dot, { backgroundColor: color, opacity }]} />;
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    zIndex: 50,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.dark,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  pressed: { opacity: 0.9 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  eta: { ...typography.bodyStrong, color: colors.white, fontSize: 13 },
  sub: { ...typography.caption, color: colors.white, opacity: 0.75, fontSize: 11 },
});
