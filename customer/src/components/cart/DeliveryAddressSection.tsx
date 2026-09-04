import { Pressable, StyleSheet, Text, View } from "react-native";
import { Address } from "@/types";
import { colors, radius, spacing, typography } from "@/theme";
import { Icon } from "@/components/Icon";
import { AddressCard } from "@/components/AddressCard";

type Props = {
  address: Address | null;
  onManageAddress: () => void;
};

export function DeliveryAddressSection({ address, onManageAddress }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={typography.h3}>Deliver To</Text>
        <Pressable onPress={onManageAddress} hitSlop={8}>
          <Text style={styles.edit}>{address ? "Change" : "Add"}</Text>
        </Pressable>
      </View>

      {address ? (
        <AddressCard address={address} selected onPress={onManageAddress} />
      ) : (
        <Pressable onPress={onManageAddress} style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}>
          <View style={styles.addIcon}>
            <Icon name="plus" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addText}>Add delivery address</Text>
            <Text style={styles.addSub}>Add a valid address so we can complete the delivery.</Text>
          </View>
          <Icon name="forward" size={18} color={colors.muted} />
        </Pressable>
      )}
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  edit: { ...typography.captionStrong, color: colors.primary },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  pressed: { opacity: 0.85 },
  addIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: { ...typography.bodyStrong },
  addSub: { ...typography.caption, marginTop: 2 },
});
