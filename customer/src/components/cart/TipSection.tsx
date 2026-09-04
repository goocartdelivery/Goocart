import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

type Props = {
  tip: number;
  customTip: string;
  onSelectPreset: (amount: number) => void;
  onCustomChange: (digits: string, value: number) => void;
};

const PRESETS = [10, 20, 30, 50];

export function TipSection({ tip, customTip, onSelectPreset, onCustomChange }: Props) {
  return (
    <View style={styles.card}>
      <Text style={typography.h3}>Add a tip</Text>
      <Text style={styles.hint}>100% of your tip goes directly to the delivery partner.</Text>
      <View style={styles.row}>
        {PRESETS.map((amount) => {
          const active = tip === amount;
          return (
            <Pressable
              key={amount}
              onPress={() => onSelectPreset(amount)}
              style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>₹{amount}</Text>
            </Pressable>
          );
        })}
        <TextInput
          value={customTip}
          onChangeText={(t) => {
            const digits = t.replace(/[^0-9]/g, "");
            onCustomChange(digits, digits ? Number(digits) : 0);
          }}
          placeholder="Other"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          style={[styles.chip, styles.input, tip > 0 && !PRESETS.includes(tip) && styles.chipActive]}
        />
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
    gap: spacing.md,
  },
  hint: { ...typography.caption },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    minWidth: 64,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { opacity: 0.8 },
  chipText: { ...typography.bodyStrong },
  chipTextActive: { color: colors.white },
  input: { width: 80 },
});
