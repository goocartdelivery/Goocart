import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing, typography } from "@/theme";
import { Icon } from "@/components/Icon";
import { PrimaryButton } from "@/components/PrimaryButton";

const CANCEL_REASONS = ["Changed my mind", "Ordered by mistake", "Taking too long", "Other"] as const;

type Props = {
  visible: boolean;
  busy?: boolean;
  orderLabel?: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

// Bottom-sheet confirmation for cancelling. Never cancels directly on tap —
// always requires choosing (or defaulting) a reason and pressing Confirm, and
// surfaces any refund/COD note only from real data the caller passes in.
export function CancelOrderSheet({ visible, busy, orderLabel, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState<string | null>(null);

  const confirm = () => onConfirm(reason ?? CANCEL_REASONS[0]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <SafeAreaView edges={["bottom"]} style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: spacing.lg }}>
            <View style={styles.headerRow}>
              <View style={styles.warnIcon}>
                <Icon name="close" size={20} color={colors.error} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.h2}>Cancel this order?</Text>
                <Text style={styles.sub}>{orderLabel ? `${orderLabel} · this cannot be undone.` : "This cannot be undone."}</Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>TELL US WHY (OPTIONAL)</Text>
            <View style={{ gap: spacing.sm }}>
              {CANCEL_REASONS.map((r) => (
                <Pressable key={r} style={[styles.reasonRow, reason === r && styles.reasonRowActive]} onPress={() => setReason(r)}>
                  <View style={[styles.radio, reason === r && styles.radioActive]}>{reason === r ? <View style={styles.radioDot} /> : null}</View>
                  <Text style={typography.body}>{r}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <PrimaryButton label={busy ? "Cancelling…" : "Confirm Cancellation"} variant="primary" onPress={confirm} disabled={busy} loading={busy} />
            <Pressable onPress={onClose} style={styles.keepBtn} accessibilityRole="button">
              <Text style={styles.keepText}>Keep Order</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "#00000055" },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: "85%" },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginTop: spacing.sm },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  headerRow: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start", marginBottom: spacing.lg },
  warnIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.errorMuted, alignItems: "center", justifyContent: "center" },
  sub: { ...typography.caption, color: colors.muted, marginTop: 2 },
  sectionLabel: { ...typography.eyebrow, fontSize: 10, marginBottom: spacing.sm, color: colors.muted },
  reasonRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  reasonRowActive: { borderColor: colors.error, backgroundColor: colors.errorMuted },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: colors.error },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.error },
  footer: { padding: spacing.xl, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
  keepBtn: { alignItems: "center", paddingVertical: spacing.sm },
  keepText: { ...typography.bodyStrong, color: colors.muted },
});
