import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBadge } from "@/components/StatusBadge";
import { PrimaryButton } from "@/components/PrimaryButton";
import { colors, radius, spacing, typography } from "@/theme";
import { FoodOrder, FoodOrderStatus, hasPermission, VendorUser } from "@/types";

const STATUS_BORDER: Record<string, string> = {
  PLACED: colors.primary,
  VENDOR_ACCEPTED: colors.success,
  PREPARING: colors.warning,
  READY_FOR_PICKUP: "#0284C7",
  VENDOR_REJECTED: colors.error,
  CANCELLED_BY_CUSTOMER: colors.error,
  CANCELLED_BY_ADMIN: colors.error,
};

const NEXT_STEP: Partial<Record<FoodOrderStatus, { to: FoodOrderStatus; label: string; permission: "CAN_UPDATE_ORDER_STATUS" | "CAN_MARK_READY" }>> = {
  VENDOR_ACCEPTED: { to: "PREPARING", label: "Start preparing", permission: "CAN_UPDATE_ORDER_STATUS" },
  PREPARING: { to: "READY_FOR_PICKUP", label: "Ready for pickup", permission: "CAN_MARK_READY" },
};

function formatElapsed(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

type Props = {
  order: FoodOrder;
  busy: boolean;
  user: VendorUser | null;
  onAct: (to: FoodOrderStatus) => void;
};

export function OrderCard({ order, busy, user, onAct }: Props) {
  const [elapsed, setElapsed] = useState(() => formatElapsed(order.createdAt));

  useEffect(() => {
    const id = setInterval(() => setElapsed(formatElapsed(order.createdAt)), 30000);
    return () => clearInterval(id);
  }, [order.createdAt]);

  const next = NEXT_STEP[order.status];
  const canAccept = hasPermission(user, "CAN_ACCEPT_ORDER");
  const canReject = hasPermission(user, "CAN_REJECT_ORDER");
  const canAdvance = next ? hasPermission(user, next.permission) : false;
  const borderColor = STATUS_BORDER[order.status] ?? colors.border;

  return (
    <View style={[styles.card, { borderLeftColor: borderColor }]}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderNum}>#{order.orderNumber}</Text>
          <Text style={styles.time}>{elapsed}</Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      {order.status === "PLACED" && order.autoAccepted ? (
        <Text style={styles.autoTag}>Auto-accepted</Text>
      ) : order.status === "PLACED" && order.manualAcceptanceRequired ? (
        <Text style={styles.manualTag}>Accept required</Text>
      ) : null}

      <View style={styles.itemsWrap}>
        {order.items.map((item) => (
          <Text key={item.lineId} style={styles.itemLine}>
            {item.quantity} x {item.name}
          </Text>
        ))}
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>₹{order.bill.total}</Text>
      </View>

      {order.status === "PLACED" ? (
        canAccept || canReject ? (
          <View style={styles.actionRow}>
            {canAccept ? (
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Accept" onPress={() => onAct("VENDOR_ACCEPTED")} disabled={busy} />
              </View>
            ) : null}
            {canReject ? (
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Reject" variant="danger" onPress={() => onAct("VENDOR_REJECTED")} disabled={busy} />
              </View>
            ) : null}
          </View>
        ) : (
          <Text style={styles.viewOnly}>Waiting for authorized team member</Text>
        )
      ) : next ? (
        canAdvance ? (
          <PrimaryButton label={busy ? "Updating..." : next.label} onPress={() => onAct(next.to)} disabled={busy} />
        ) : (
          <Text style={styles.viewOnly}>No permission to update</Text>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  orderNum: { ...typography.h3, letterSpacing: -0.3 },
  time: { ...typography.caption, marginTop: 2 },
  autoTag: { ...typography.captionStrong, color: colors.success },
  manualTag: { ...typography.captionStrong, color: colors.warning },
  itemsWrap: { gap: 2, marginVertical: spacing.xs },
  itemLine: { ...typography.body, color: colors.muted },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { ...typography.bodyStrong },
  totalValue: { ...typography.h3, color: colors.primary },
  actionRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  viewOnly: { ...typography.caption, color: colors.muted, fontStyle: "italic", marginTop: spacing.xs },
});
