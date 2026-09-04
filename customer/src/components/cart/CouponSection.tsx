import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";
import { Icon } from "@/components/Icon";

export type CouponSuggestion = {
  code: string;
  title: string;
  available: boolean;
};

type Props = {
  appliedCode: string | null;
  inputValue: string;
  error: string | null;
  suggestions: CouponSuggestion[];
  onInputChange: (v: string) => void;
  onApply: () => void;
  onRemove: () => void;
  onApplySuggestion: (code: string) => void;
};

export function CouponSection({ appliedCode, inputValue, error, suggestions, onInputChange, onApply, onRemove, onApplySuggestion }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Text style={typography.h3}>Coupon</Text>
        <Icon name="offer" size={18} color={colors.primary} />
      </View>

      {appliedCode ? (
        <View style={styles.applied}>
          <View style={styles.appliedRow}>
            <View style={styles.appliedIcon}>
              <Icon name="checkCircle" size={16} color={colors.white} />
            </View>
            <View>
              <Text style={styles.appliedTitle}>{appliedCode} applied</Text>
              <Text style={styles.appliedSub}>Great pick — discount added below</Text>
            </View>
          </View>
          <Pressable onPress={onRemove} style={styles.removeBtn} hitSlop={8}>
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.entry}>
          <View style={styles.inputRow}>
            <TextInput
              value={inputValue}
              onChangeText={onInputChange}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="Enter coupon code"
              placeholderTextColor={colors.muted}
              style={styles.input}
              onSubmitEditing={onApply}
              returnKeyType="done"
            />
            <Pressable accessibilityRole="button" onPress={onApply} style={({ pressed }) => [styles.applyBtn, pressed && styles.pressed]}>
              <Text style={styles.applyText}>Apply</Text>
            </Pressable>
          </View>
          {error ? (
            <View style={styles.errorRow}>
              <Icon name="alert" size={14} color={colors.error} />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}
        </View>
      )}

      {suggestions.length > 0 ? (
        <View style={styles.suggestions}>
          <Text style={styles.suggestionsLabel}>Best offers</Text>
          {suggestions.map((s) => (
            <Pressable
              key={s.code}
              accessibilityRole="button"
              disabled={!s.available}
              onPress={() => onApplySuggestion(s.code)}
              style={({ pressed }) => [styles.suggestion, !s.available && styles.suggestionDisabled, pressed && s.available && styles.pressed]}
            >
              <View style={styles.suggestionIcon}>
                <Icon name="coupon" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.suggestionCode}>{s.code}</Text>
                <Text style={styles.suggestionTitle} numberOfLines={1}>
                  {s.title}
                </Text>
              </View>
              <Text style={[styles.suggestionAction, s.available ? styles.suggestionActionActive : styles.suggestionActionLocked]}>
                {s.available ? "APPLY" : "Ineligible"}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
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
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  applied: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.successMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  appliedRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  appliedIcon: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  appliedTitle: { ...typography.bodyStrong, color: colors.success },
  appliedSub: { ...typography.caption, color: colors.success, fontSize: 11 },
  removeBtn: { paddingHorizontal: spacing.sm },
  removeText: { ...typography.captionStrong, color: colors.error },
  entry: { gap: spacing.sm },
  inputRow: { flexDirection: "row", gap: spacing.sm },
  input: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    ...typography.body,
  },
  applyBtn: {
    height: 46,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.8 },
  applyText: { color: colors.primary, fontWeight: "800", fontSize: 14 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  error: { ...typography.caption, color: colors.error, flex: 1 },
  suggestions: { gap: spacing.sm, marginTop: spacing.xs },
  suggestionsLabel: { ...typography.captionStrong, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6 },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  suggestionDisabled: { opacity: 0.6 },
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionCode: { ...typography.bodyStrong },
  suggestionTitle: { ...typography.caption },
  suggestionAction: { ...typography.captionStrong, fontSize: 11, letterSpacing: 0.5 },
  suggestionActionActive: { color: colors.primary },
  suggestionActionLocked: { color: colors.muted },
});
