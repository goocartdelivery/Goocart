import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/theme";
import { PrimaryButton } from "@/components/PrimaryButton";

type Props = {
  title: string;
  copy: string;
  actionLabel?: string;
  onAction?: () => void;
};

// Minimal empty state — no decorative icon, just clear type and a single quiet
// call to action. Reads as a real, calm product screen rather than a template.
export function OrderEmptyState({ title, copy, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.copy}>{copy}</Text>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <PrimaryButton label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl, gap: 6 },
  title: { ...typography.h2, textAlign: "center" },
  copy: { ...typography.body, color: colors.muted, textAlign: "center", maxWidth: 300, lineHeight: 20 },
  action: { marginTop: spacing.md, width: "100%", maxWidth: 280 },
});
