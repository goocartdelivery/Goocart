import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";
import { Icon } from "@/components/Icon";

type Props = {
  restaurantName: string | null;
  area?: string;
  etaText?: string | null;
  onAddMore: () => void;
};

// Restaurant identity card at the top of a filled cart: name, area, delivery
// ETA (when known) and a shortcut back into the menu to add more.
export function RestaurantSummary({ restaurantName, area, etaText, onAddMore }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.eyebrow}>ORDERING FROM</Text>
          <Text style={styles.name}>{restaurantName ?? "Restaurant"}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(restaurantName ?? "R").slice(0, 1).toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        {etaText ? (
          <View style={styles.metaChip}>
            <Icon name="time" size={14} color={colors.muted} />
            <Text style={styles.metaText}>{etaText}</Text>
          </View>
        ) : null}
        {area ? (
          <View style={styles.metaChip}>
            <Icon name="location" size={14} color={colors.muted} />
            <Text style={styles.metaText}>{area}</Text>
          </View>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onAddMore}
        style={({ pressed }) => [styles.addMore, pressed && styles.pressed]}
      >
        <Icon name="plus" size={16} color={colors.primary} />
        <Text style={styles.addMoreText}>Add more items</Text>
      </Pressable>
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  titleWrap: { flex: 1 },
  eyebrow: { ...typography.eyebrow, fontSize: 10 },
  name: { ...typography.h2, marginTop: 2 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { ...typography.display, color: colors.primary, fontSize: 22 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  metaText: { ...typography.caption, fontSize: 12 },
  addMore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.8 },
  addMoreText: { ...typography.bodyStrong, color: colors.primary },
});
