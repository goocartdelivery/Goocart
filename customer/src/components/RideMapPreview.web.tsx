import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

type Props = {
  pickup: { latitude: number; longitude: number; address: string };
  drop: { latitude: number; longitude: number; address: string };
  height?: number;
};

export function RideMapPreview({ pickup, drop, height = 200 }: Props) {
  return (
    <View style={[styles.wrap, { height }]}>
      <Text style={typography.bodyStrong}>Route map preview</Text>
      <Text style={styles.copy}>
        {pickup.address} → {drop.address}
      </Text>
      <Text style={styles.copy}>Map renders on Android/iOS in Expo Go.</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>WEB PREVIEW</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 140,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: 4,
    justifyContent: "center",
  },
  copy: { ...typography.caption },
  badge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.dark,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
});
