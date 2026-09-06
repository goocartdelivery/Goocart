import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/theme";
import { Icon } from "@/components/Icon";
import {
  FOOD_STEPPER,
  FOOD_STEP_LABEL,
  RIDE_STEPPER,
  SERVICE_STATUS_LABEL,
  STORE_STEPPER,
} from "@/orders/orderStatus";

type Props = {
  // Which progression to render.
  kind: "food" | "store" | "ride";
  // The current backend status value.
  status: string;
};

// Vertical "✓ / ● / ○" progress stepper. Steps mirror the ACTUAL backend
// progression for the order kind; current/completed are computed from the real
// status, never from a fabricated sequence position.
export function StatusStepper({ kind, status }: Props) {
  const steps = kind === "food" ? FOOD_STEPPER : kind === "ride" ? RIDE_STEPPER : STORE_STEPPER;
  const currentIndex = steps.indexOf(status);
  const terminal = status === "DELIVERED" || status === "COMPLETED" || status.startsWith("CANCELLED") || status === "VENDOR_REJECTED";

  const stepLabel = (step: string): string => {
    if (kind === "food") return FOOD_STEP_LABEL[step as keyof typeof FOOD_STEP_LABEL] ?? step.replaceAll("_", " ");
    return SERVICE_STATUS_LABEL[step] ?? step.replaceAll("_", " ");
  };

  return (
    <View>
      {steps.map((step, index) => {
        // For a terminal (cancelled/failed) order the forward steps past the
        // cancellation point are marked as not-reached.
        const done = terminal && kind !== "food" ? index < steps.indexOf("DELIVERED") : index < currentIndex;
        const active = index === currentIndex;
        const isLast = index === steps.length - 1;
        const muted = !done && !active;
        return (
          <View key={step} style={styles.row}>
            <View style={styles.markerCol}>
              <View style={[styles.marker, done && styles.markerDone, active && styles.markerActive, terminal && !done && !active && styles.markerMuted]}>
                {done ? (
                  <Icon name="check" size={12} color={colors.white} />
                ) : active ? (
                  <View style={styles.activeDot} />
                ) : (
                  <View style={styles.pendingDot} />
                )}
              </View>
              {!isLast ? <View style={[styles.line, done && styles.lineDone]} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: isLast ? 0 : spacing.sm }}>
              <Text style={[typography.body, active && typography.bodyStrong, muted && styles.mutedText]}>{stepLabel(step)}</Text>
              {active ? <Text style={styles.currentHint}>{terminal ? "Final state" : "Currently in progress"}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.md },
  markerCol: { alignItems: "center", width: 26 },
  marker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  markerDone: { backgroundColor: colors.success, borderColor: colors.success },
  markerActive: { borderColor: colors.primary },
  markerMuted: { opacity: 0.4 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  pendingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  line: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 2 },
  lineDone: { backgroundColor: colors.success },
  mutedText: { color: colors.muted },
  currentHint: { ...typography.caption, color: colors.primary, fontSize: 10, marginTop: 2 },
});
