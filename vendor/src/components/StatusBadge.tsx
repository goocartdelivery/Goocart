import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";
import { FoodOrderStatus } from "@/types";

const STATUS_CONFIG: Record<string, { bg: string; fg: string; label: string }> = {
  PLACED: { bg: colors.primaryMuted, fg: colors.primary, label: "New" },
  VENDOR_ACCEPTED: { bg: colors.successMuted, fg: colors.success, label: "Accepted" },
  PREPARING: { bg: colors.warningMuted, fg: colors.warning, label: "Preparing" },
  READY_FOR_PICKUP: { bg: "#E0F2FE", fg: "#0284C7", label: "Ready" },
  DELIVERY_PARTNER_ASSIGNED: { bg: "#EDE9FE", fg: "#7C3AED", label: "Assigned" },
  GOING_TO_VENDOR: { bg: "#EDE9FE", fg: "#7C3AED", label: "En route" },
  ARRIVED_AT_VENDOR: { bg: "#EDE9FE", fg: "#7C3AED", label: "Arrived" },
  PICKED_UP: { bg: "#EDE9FE", fg: "#7C3AED", label: "Picked up" },
  ON_THE_WAY: { bg: "#EDE9FE", fg: "#7C3AED", label: "On the way" },
  ARRIVED: { bg: "#EDE9FE", fg: "#7C3AED", label: "Arrived" },
  DELIVERED: { bg: colors.successMuted, fg: colors.success, label: "Delivered" },
  VENDOR_REJECTED: { bg: colors.errorMuted, fg: colors.error, label: "Rejected" },
  CANCELLED_BY_CUSTOMER: { bg: colors.errorMuted, fg: colors.error, label: "Cancelled" },
  CANCELLED_BY_ADMIN: { bg: colors.errorMuted, fg: colors.error, label: "Cancelled" },
};

export function StatusBadge({ status }: { status: FoodOrderStatus }) {
  const config = STATUS_CONFIG[status] ?? { bg: colors.background, fg: colors.muted, label: status.replaceAll("_", " ") };
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.fg }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    alignSelf: "flex-start",
  },
  text: {
    ...typography.captionStrong,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
