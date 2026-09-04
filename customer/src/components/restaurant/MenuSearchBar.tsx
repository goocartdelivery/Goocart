import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { colors, radius, spacing } from "@/theme";
import { Icon } from "@/components/Icon";

// Compact in-page menu search. Query lives in the parent; this is a controlled
// input that also exposes a clear affordance.
export function MenuSearchBar({ value, onChangeText }: { value: string; onChangeText: (v: string) => void }) {
  return (
    <View style={styles.wrap}>
      <Icon name="search" size={16} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search dishes"
        placeholderTextColor={colors.muted}
        style={styles.input}
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText("")} hitSlop={8} accessibilityLabel="Clear search">
          <Icon name="close" size={16} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  input: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 0 },
});
