import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/theme";
import { Icon } from "@/components/Icon";

type Props = {
  title: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
};

export function GrocerySectionHeader({ title, showViewAll, onViewAll }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {showViewAll ? (
        <Pressable
          onPress={onViewAll}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`View all ${title}`}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionText}>View All</Text>
          <Icon name="forward" size={15} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    minHeight: 40,
  },
  title: {
    ...typography.h2,
    fontSize: 18,
    flex: 1,
    marginRight: spacing.sm,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 2,
  },
  pressed: { opacity: 0.7 },
  actionText: {
    ...typography.captionStrong,
    color: colors.primary,
    fontSize: 12,
  },
});
