import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";
import { Icon } from "@/components/Icon";
import { DeliveryInstruction } from "@/types";

type Props = {
  instructions: readonly string[];
  onToggle: (instruction: DeliveryInstruction) => void;
};

const OPTIONS = ["Don't ring bell", "Leave at door", "Call on arrival", "Avoid plastic cutlery"] as const;

export function DeliveryInstructions({ instructions, onToggle }: Props) {
  return (
    <View style={styles.card}>
      <Text style={typography.h3}>Delivery Instructions</Text>
      <Text style={styles.hint}>Let the delivery partner know what to expect.</Text>
      <View style={styles.list}>
        {OPTIONS.map((instruction) => {
          const checked = (instructions as readonly string[]).includes(instruction);
          return (
            <Pressable key={instruction} onPress={() => onToggle(instruction)} style={styles.option}>
              <View style={[styles.checkbox, checked && styles.checkboxActive]}>
                {checked ? <Icon name="check" size={12} color={colors.white} /> : null}
              </View>
              <Text style={styles.optionText}>{instruction}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  hint: { ...typography.caption, marginBottom: spacing.sm },
  list: { gap: spacing.md },
  option: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { ...typography.body },
});
