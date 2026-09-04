import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Restaurant } from "@/types";
import { colors, radius, spacing, typography } from "@/theme";
import { Icon } from "@/components/Icon";

// Horizontal showcase of the restaurant's live offers (backend-driven; only
// rendered when the restaurant actually has offers).
export function RestaurantOffers({ restaurant }: { restaurant: Restaurant }) {
  if (!restaurant.offers.length) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.headingRow}>
        <Icon name="offer" size={16} color={colors.primary} />
        <Text style={styles.heading}>Offers</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {restaurant.offers.map((offer, index) => (
          <View key={offer.title + index} style={styles.card}>
            <Icon name="coupon" size={20} color={colors.primary} />
            <Text style={styles.cardTitle} numberOfLines={1}>
              {offer.title}
            </Text>
            {offer.description ? (
              <Text style={styles.cardCopy} numberOfLines={2}>
                {offer.description}
              </Text>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, paddingVertical: spacing.sm },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing.xl },
  heading: { ...typography.h2, fontSize: 17 },
  row: { gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  card: {
    width: 220,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: 6,
  },
  cardTitle: { ...typography.bodyStrong, color: colors.primary, fontSize: 13 },
  cardCopy: { ...typography.caption, lineHeight: 16 },
});
