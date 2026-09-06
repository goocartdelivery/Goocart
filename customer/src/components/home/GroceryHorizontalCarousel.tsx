import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { GrocerySectionHeader } from "@/components/home/GrocerySectionHeader";
import { GroceryProductCard } from "@/components/home/GroceryProductCard";
import { SkeletonBlock } from "@/components/SkeletonBlock";
import { ServiceProduct } from "@/services/ServiceOrderService";
import { storeProductRef, useStoreCartStore } from "@/store/useStoreCartStore";
import { serviceConfig } from "@/constants/serviceHome";
import { spacing } from "@/theme";

type Props = {
  title: string;
  products: ServiceProduct[];
  loading: boolean;
  accent?: string;
  onViewAll?: () => void;
};

const VISIBLE_RATIO = 2.3;
const MIN_CARD = 150;
const MAX_CARD = 185;
const H_PAD = spacing.lg;
const GAP = spacing.md;

export function GroceryHorizontalCarousel({ title, products, loading, accent, onViewAll }: Props) {
  const { width } = useWindowDimensions();
  const storeItems = useStoreCartStore((s) => s.items);
  const addItem = useStoreCartStore((s) => s.addItem);
  const updateQty = useStoreCartStore((s) => s.updateQty);
  const groceryAccent = accent ?? serviceConfig("GROCERY").theme.primary;

  if (!loading && products.length === 0) return null;

  const usable = Math.min(width, 560) - H_PAD * 2;
  const cardWidth = Math.max(MIN_CARD, Math.min(MAX_CARD, Math.floor((usable - GAP * (VISIBLE_RATIO - 1)) / VISIBLE_RATIO)));
  const skeletonCount = 3;
  const qtyFor = (id: string) => storeItems.find((i) => i.productId === id)?.quantity ?? 0;

  return (
    <View style={styles.wrap}>
      <GrocerySectionHeader title={title} showViewAll={!loading && products.length > 0} onViewAll={onViewAll} />
      {loading ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.hScroll, { paddingHorizontal: H_PAD }]}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <View key={i} style={[styles.skeletonCard, { width: cardWidth, marginRight: i < skeletonCount - 1 ? GAP : 0 }]}>
              <SkeletonBlock width="100%" height={cardWidth * 1.15} style={{ borderRadius: 0 }} />
              <View style={styles.skeletonBody}>
                <SkeletonBlock width="85%" height={12} />
                <SkeletonBlock width="55%" height={10} />
                <View style={styles.skeletonPriceRow}>
                  <SkeletonBlock width="45%" height={14} />
                  <SkeletonBlock width="35%" height={22} />
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.hScroll, { paddingHorizontal: H_PAD, gap: GAP }]}>
          {products.map((p) => {
            const qty = qtyFor(p.id);
            const line = storeItems.find((i) => i.productId === p.id);
            return (
              <GroceryProductCard
                key={p.id}
                product={p}
                cardWidth={cardWidth}
                qty={qty}
                accent={groceryAccent}
                onInc={() => addItem(storeProductRef(p))}
                onDec={() => {
                  if (line) updateQty(line.lineId, -1);
                }}
              />
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  hScroll: { paddingVertical: spacing.xs },
  skeletonCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E7E4E1",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  skeletonBody: { padding: spacing.sm, gap: 5 },
  skeletonPriceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
});
