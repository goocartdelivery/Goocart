import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "@/theme";
import { IconName } from "@/components/Icon";
import { foodBucket, orderStatusLabel, serviceBucket } from "@/orders/orderStatus";
import { FoodOrder } from "@/types";

type Tone = "primary" | "success" | "warning" | "error" | "neutral";

// A coloured pill that communicates order state. Uses text (not colour alone)
// so the status is still obvious for accessibility.
export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  const palette = {
    primary: { bg: colors.primaryMuted, text: colors.primary },
    success: { bg: colors.successMuted, text: colors.success },
    warning: { bg: colors.warningMuted, text: colors.warning },
    error: { bg: colors.errorMuted, text: colors.error },
    neutral: { bg: colors.border, text: colors.muted },
  }[tone];
  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

export function foodStatusTone(status: FoodOrder["status"]): Tone {
  const bucket = foodBucket(status);
  if (bucket === "completed") return "success";
  if (bucket === "cancelled") return "error";
  return "primary";
}

export function serviceStatusTone(status: string): Tone {
  const bucket = serviceBucket(status);
  if (bucket === "completed") return "success";
  if (bucket === "cancelled") return "error";
  return "primary";
}

export function foodStatusBadge(status: FoodOrder["status"]) {
  return <StatusBadge label={orderStatusLabel(status)} tone={foodStatusTone(status)} />;
}

export function serviceStatusBadge(status: string) {
  return <StatusBadge label={orderStatusLabel(status)} tone={serviceStatusTone(status)} />;
}

export function bucketIcon(bucket: "ongoing" | "completed" | "cancelled"): IconName {
  return bucket === "completed" ? "checkCircle" : bucket === "cancelled" ? "close" : "time";
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
  },
  text: { fontSize: 10, fontWeight: "800", letterSpacing: 0.2 },
});
