import { StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/Icon";
import { PrimaryButton } from "@/components/PrimaryButton";
import { colors, radius, spacing, typography } from "@/theme";

type Props = {
  pickupName: string;
  dropName: string;
  distanceKm: number;
  baseFare: number;
  perKm: number;
  platformFee: number;
  total: number;
  onBook: () => void;
  booking: boolean;
};

export function FareOverlay({
  pickupName,
  dropName,
  distanceKm,
  baseFare,
  perKm,
  platformFee,
  total,
  onBook,
  booking,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.routeRow}>
        <Icon name="location" size={14} color={colors.primary} />
        <Text style={styles.routeText} numberOfLines={1}>{pickupName}</Text>
      </View>
      <View style={styles.routeDivider} />
      <View style={styles.routeRow}>
        <Icon name="location" size={14} color={colors.dark} />
        <Text style={styles.routeText} numberOfLines={1}>{dropName}</Text>
      </View>

      <View style={styles.distanceRow}>
        <Text style={typography.caption}>{distanceKm} km</Text>
        <Text style={typography.caption}>•</Text>
        <Text style={typography.caption}>~{Math.round(distanceKm * 3)} min</Text>
      </View>

      <View style={styles.breakdown}>
        <View style={styles.breakdownRow}>
          <Text style={typography.caption}>Base fare</Text>
          <Text style={typography.bodyStrong}>₹{baseFare}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={typography.caption}>Distance ({distanceKm} km × ₹{perKm})</Text>
          <Text style={typography.bodyStrong}>₹{Math.round(perKm * distanceKm)}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={typography.caption}>Platform fee</Text>
          <Text style={typography.bodyStrong}>₹{platformFee}</Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.breakdownRow}>
          <Text style={typography.bodyStrong}>Total</Text>
          <Text style={styles.totalAmount}>₹{total}</Text>
        </View>
      </View>

      <PrimaryButton
        label={booking ? "Booking…" : "Book Bike Taxi"}
        onPress={onBook}
        disabled={booking}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 6,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  routeText: { ...typography.body, flex: 1 },
  routeDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.border,
    marginLeft: 6,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  breakdown: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  totalAmount: {
    fontSize: 19,
    fontWeight: "700",
    color: colors.primary,
  },
});
