import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "@/theme";

function ShimmerBlock({ width, height = 14, borderRadius = radius.sm }: { width: number | string; height?: number; borderRadius?: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.block,
        { width: width as any, height, borderRadius, opacity },
      ]}
    />
  );
}

export function SkeletonOrderCard() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <ShimmerBlock width={100} height={16} />
        <ShimmerBlock width={60} height={14} />
      </View>
      <ShimmerBlock width="70%" height={13} />
      <ShimmerBlock width="40%" height={13} />
      <View style={styles.row}>
        <ShimmerBlock width={120} height={36} borderRadius={radius.md} />
      </View>
    </View>
  );
}

export function SkeletonStatRow() {
  return (
    <View style={styles.statRow}>
      <View style={styles.statCard}>
        <ShimmerBlock width={36} height={36} borderRadius={radius.md} />
        <ShimmerBlock width={30} height={22} />
        <ShimmerBlock width={60} height={11} />
      </View>
      <View style={styles.statCard}>
        <ShimmerBlock width={36} height={36} borderRadius={radius.md} />
        <ShimmerBlock width={30} height={22} />
        <ShimmerBlock width={50} height={11} />
      </View>
    </View>
  );
}

export function SkeletonMenuCard() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <ShimmerBlock width={56} height={56} borderRadius={radius.md} />
        <View style={{ flex: 1, gap: 6 }}>
          <ShimmerBlock width="60%" height={15} />
          <ShimmerBlock width="30%" height={13} />
        </View>
        <ShimmerBlock width={42} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.border },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  statRow: { flexDirection: "row", gap: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
