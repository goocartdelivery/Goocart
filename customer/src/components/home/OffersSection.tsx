import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useCatalogStore } from "@/store/useCatalogStore";
import { MOCK_OFFERS } from "@/data/offerMock";
import { Coupon } from "@/types";
import { colors, radius, spacing } from "@/theme";
import { RemoteImage } from "@/components/RemoteImage";

function couponCopy(c: Coupon): string {
  switch (c.type) {
    case "PERCENT":
      return `${c.value}% OFF`;
    case "FLAT":
      return `₹${c.value} OFF`;
    case "FREE_DELIVERY":
      return "FREE DELIVERY";
  }
}

function couponRule(c: Coupon): string {
  if (c.maxDiscount) return `Up to ₹${c.maxDiscount} • Min order ₹${c.minOrder}`;
  if (c.minOrder) return `Min order ₹${c.minOrder}`;
  return "No minimum order";
}

type Props = {
  // When true, only offer banners tagged with the active veg filter
  // (foodType === "veg") are shown. Applies to mock offers; real backend
  // coupons carry no foodType so they always appear.
  vegOnly?: boolean;
};

export function OffersSection({ vegOnly = false }: Props) {
  const coupons = useCatalogStore((s) => s.coupons);

  // Real backend offers first; mock offers only when the backend returns none
  // (API down or empty), so real data is never hidden behind placeholders.
  const rows = useMemo(() => {
    const home = coupons.filter((c) => c.showOnHome);
    const source = home.length > 0 ? home : MOCK_OFFERS;
    return vegOnly ? source.filter((c) => !c.foodType || c.foodType === "veg") : source;
  }, [coupons, vegOnly]);

  if (!rows.length) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.wrap}>
      {rows.map((c) => (
        <View key={c.code} style={styles.card}>
          {c.imageUrl ? (
            <>
              <RemoteImage uri={c.imageUrl} fallbackLabel={c.code} style={StyleSheet.absoluteFillObject} />
              <View style={styles.scrim} />
            </>
          ) : null}
          <View style={styles.content}>
            <Text style={styles.value}>{couponCopy(c)}</Text>
            <Text style={styles.title} numberOfLines={1}>
              {c.title}
            </Text>
            <Text style={styles.rule} numberOfLines={1}>
              {couponRule(c)}
            </Text>
            <View style={styles.codeChip}>
              <Text style={styles.code}>{c.code}</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md, paddingHorizontal: spacing.lg },
  card: {
    width: 236,
    height: 148,
    backgroundColor: colors.dark,
    borderRadius: radius.lg,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  content: { padding: spacing.md, gap: 3 },
  value: { color: colors.white, fontSize: 22, fontWeight: "900" },
  title: { color: "#F4F4F5", fontSize: 12.5, fontWeight: "700" },
  rule: { color: "#D4D4D8", fontSize: 10.5, fontWeight: "500" },
  codeChip: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  code: { color: colors.white, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
});