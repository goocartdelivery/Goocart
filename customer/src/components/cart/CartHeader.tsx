import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, radius, spacing, typography } from "@/theme";
import { Icon } from "@/components/Icon";

type Props = {
  itemCount: number;
  restaurantName: string | null;
  onClear?: () => void;
};

// Premium cart header: back, title with live item count, optional clear cart.
export function CartHeader({ itemCount, restaurantName, onClear }: Props) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backBtn}>
        <Icon name="back" size={20} color={colors.text} />
      </Pressable>
      <View style={styles.titleWrap}>
        <Text style={typography.h2}>
          Your Cart{itemCount > 0 ? ` · ${itemCount}` : ""}
        </Text>
        {restaurantName && itemCount > 0 ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {restaurantName}
          </Text>
        ) : null}
      </View>
      {itemCount > 0 && onClear ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear cart" onPress={onClear} style={styles.clearBtn} hitSlop={8}>
          <Icon name="close" size={18} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  titleWrap: { flex: 1 },
  subtitle: { ...typography.caption, marginTop: 1 },
  clearBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
