import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { colors, radius, spacing, typography } from "@/theme";
import { useNewOrderPopupStore } from "@/store/useNewOrderPopupStore";
import { PAYMENT_BADGE_COLORS, paymentDisplay } from "@/utils/payment";

const AUTO_DISMISS_MS = 8000;

function formatCurrency(n: number): string {
  return n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n}`;
}

/**
 * Global new-order popup, mounted in the root layout so it can surface over
 * any screen. Shows one notification at a time from the store queue (newest
 * first); "View Order" jumps straight to that order's detail screen.
 */
export function NewOrderPopup() {
  const current = useNewOrderPopupStore((s) => s.queue[0]);
  const extraCount = useNewOrderPopupStore((s) => Math.max(0, s.queue.length - 1));
  const dismiss = useNewOrderPopupStore((s) => s.dismiss);
  const insets = useSafeAreaInsets();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (current) {
      timer.current = setTimeout(() => dismiss(current.id), AUTO_DISMISS_MS);
    }
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [current, dismiss]);

  if (!current) return null;

  const open = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    dismiss(current.id);
    router.push({ pathname: "/order/[id]", params: { id: current.id } });
  };

  const close = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    dismiss(current.id);
  };

  return (
    <View pointerEvents="box-none" style={[styles.overlay, { top: insets.top + spacing.sm }]}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.iconCircle}>
            <Icon name="bag" size={18} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>New Order Received</Text>
            <Text style={styles.subtitle}>
              #{current.orderNumber}
              {extraCount > 0 ? ` · +${extraCount} more` : ""}
            </Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Dismiss notification" onPress={close} hitSlop={12}>
            <Icon name="close" size={20} color={colors.muted} />
          </Pressable>
        </View>
        <Text style={styles.detail}>
          {current.customerName} · {current.itemCount} item{current.itemCount === 1 ? "" : "s"} · {formatCurrency(current.total)}
        </Text>
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Payment:</Text>
          <View style={[styles.paymentBadge, { backgroundColor: PAYMENT_BADGE_COLORS[paymentDisplay(current).tone].background }]}>
            <Text style={[styles.paymentText, { color: PAYMENT_BADGE_COLORS[paymentDisplay(current).tone].text }]}>{paymentDisplay(current).label}</Text>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="View order" onPress={open} style={styles.viewBtn}>
          <Text style={styles.viewText}>View Order</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    zIndex: 100,
    elevation: 100,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  iconCircle: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  title: { ...typography.bodyStrong, color: colors.text },
  subtitle: { ...typography.caption, color: colors.muted },
  detail: { ...typography.body, color: colors.text },
  paymentRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  paymentLabel: { ...typography.captionStrong, color: colors.muted },
  paymentBadge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  paymentText: { fontWeight: "800", fontSize: 12 },
  viewBtn: { alignSelf: "flex-start", backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  viewText: { color: colors.white, fontWeight: "700", fontSize: 14 },
});