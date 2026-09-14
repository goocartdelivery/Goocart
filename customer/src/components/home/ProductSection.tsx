import { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { RemoteImage } from "@/components/RemoteImage";
import { Icon } from "@/components/Icon";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonBlock } from "@/components/SkeletonBlock";
import { HomeCategory, ServiceConfig } from "@/constants/serviceHome";
import { matchesCategory, useServiceFavorites, useServiceHomeStore, useServiceProducts } from "@/store/useServiceHomeStore";
import { useProductDetailStore } from "@/store/useProductDetailStore";
import { storeProductRef, useStoreCartStore } from "@/store/useStoreCartStore";
import { ServiceProduct } from "@/services/ServiceOrderService";
import { colors, radius, spacing, typography } from "@/theme";

function useColumns(): { columns: number; cardWidth: number } {
  const { width } = useWindowDimensions();
  const columns = width >= 1080 ? 5 : width >= 760 ? 4 : width >= 520 ? 3 : 2;
  const gutter = spacing.md;
  const cardWidth = Math.floor((Math.min(width, 1080) - spacing.lg * 2 - gutter * (columns - 1)) / columns);
  return { columns, cardWidth };
}

export function ProductSection({ config, category }: { config: ServiceConfig; category: HomeCategory | null }) {
  const service = config.type;
  const products = useServiceProducts(service);
  const state = useServiceHomeStore((s) => s.productsState[service] ?? "idle");
  const loadProducts = useServiceHomeStore((s) => s.loadProducts);
  const favorites = useServiceFavorites(service);
  const toggleFavorite = useServiceHomeStore((s) => s.toggleFavorite);
  const openProduct = useProductDetailStore((s) => s.open);

  // All three store services (Grocery/Veg/Mart) share ONE store cart. Each
  // product is added to that same cart, so moving between the sections (or
  // the dedicated vertical screens) never splits or replaces the store cart.
  const storeItems = useStoreCartStore((s) => s.items);
  const addItem = useStoreCartStore((s) => s.addItem);
  const updateQty = useStoreCartStore((s) => s.updateQty);
  const { cardWidth } = useColumns();

  useEffect(() => {
    void loadProducts(service);
  }, [service, loadProducts]);

  const filtered = useMemo(
    () => products.filter((p) => matchesCategory(p, category?.keywords ?? [])),
    [products, category],
  );

  const qtyFor = (productId: string) => storeItems.find((i) => i.productId === productId)?.quantity ?? 0;

  return (
    <View style={styles.section}>
      {state === "idle" || state === "loading" ? (
        <GridSkeleton columns={cardWidth ? 4 : 2} cardWidth={cardWidth} />
      ) : state === "error" ? (
        <View style={styles.errorCard}>
          <Text style={typography.bodyStrong}>Couldn\u2019t load products</Text>
          <Pressable onPress={() => void loadProducts(service, true)} accessibilityRole="button">
            <Text style={styles.errorRetry}>Tap to retry</Text>
          </Pressable>
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState icon={service === "MEDICINE" ? "medical" : "grocery"} title={`No ${config.tabLabel.toLowerCase()} items yet`} copy={category ? `Nothing matches "${category.label}" right now.` : "Admin adds live products and stock from the Catalog page."} />
      ) : (
        <View style={styles.grid}>
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              cardWidth={cardWidth}
              qty={qtyFor(p.id)}
              onInc={() => addItem(storeProductRef(p))}
              onDec={() => {
                const line = storeItems.find((i) => i.productId === p.id);
                if (line) updateQty(line.lineId, -1);
              }}
              favorite={Boolean(favorites[p.id])}
              onToggleFav={() => toggleFavorite(service, p.id)}
              onOpen={() => openProduct(p)}
              accent={config.theme.primary}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function ProductCard({
  product,
  cardWidth,
  qty,
  onInc,
  onDec,
  onOpen,
  favorite,
  onToggleFav,
  accent,
}: {
  product: ServiceProduct;
  cardWidth: number;
  qty: number;
  onInc: () => void;
  onDec: () => void;
  onOpen: () => void;
  favorite: boolean;
  onToggleFav: () => void;
  accent: string;
}) {
  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`View ${product.name}`}>
        <RemoteImage uri={product.imageUrl} fallbackLabel={product.name} style={styles.cardImage} contentFit="cover" />
        <Pressable style={styles.favBtn} onPress={onToggleFav} hitSlop={8} accessibilityLabel={favorite ? "Remove from favorites" : "Add to favorites"}>
          <Icon name={favorite ? "heartFilled" : "heart"} size={16} color={favorite ? colors.error : colors.white} />
        </Pressable>
        {product.prescriptionRequired ? (
          <View style={styles.rxBadge}>
            <Text style={styles.rxText}>Rx</Text>
          </View>
        ) : null}
      </Pressable>
      <View style={styles.cardBody}>
        <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`View details for ${product.name}`}>
          <Text style={styles.cardName} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.cardDesc} numberOfLines={1}>
            {product.vendorName} • {product.description || product.eta}
          </Text>
        </Pressable>
        <View style={styles.cardPriceRow}>
          <Text style={[styles.cardPrice, { color: accent }]}>₹{product.price}</Text>
          {qty === 0 ? (
            <Pressable style={[styles.addBtn, { borderColor: accent }]} onPress={onInc} accessibilityRole="button" hitSlop={4}>
              <Text style={[styles.addBtnText, { color: accent }]}>ADD</Text>
            </Pressable>
          ) : (
            <View style={[styles.qtyRow, { borderColor: accent }]}>
              <Pressable onPress={onDec} hitSlop={8} accessibilityRole="button" style={styles.qtyBtn}>
                <Icon name="minus" size={15} color={accent} />
              </Pressable>
              <Text style={styles.qtyValue}>{qty}</Text>
              <Pressable onPress={onInc} hitSlop={8} accessibilityRole="button" style={styles.qtyBtn}>
                <Icon name="plus" size={15} color={accent} />
              </Pressable>
            </View>
          )}
        </View>
        <Text style={styles.cardStock}>In stock</Text>
      </View>
    </View>
  );
}

function GridSkeleton({ columns, cardWidth }: { columns: number; cardWidth: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: columns * 2 }).map((_, i) => (
        <View key={i} style={{ width: cardWidth }}>
          <SkeletonBlock width="100%" height={110} />
          <View style={{ padding: spacing.sm, gap: 6 }}>
            <SkeletonBlock width="85%" height={12} />
            <SkeletonBlock width="60%" height={10} />
            <SkeletonBlock width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md, paddingHorizontal: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  card: {
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  cardImage: { width: "100%", aspectRatio: 1.15 },
  favBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { padding: spacing.sm, gap: 3 },
  cardName: { ...typography.bodyStrong, fontSize: 13 },
  cardDesc: { ...typography.caption, color: colors.muted, fontSize: 10 },
  cardPriceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  cardPrice: { fontSize: 16, fontWeight: "900" },
  addBtn: { borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.sm },
  addBtnText: { fontSize: 11, fontWeight: "800" },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 4, paddingVertical: 2 },
  qtyBtn: { paddingHorizontal: 3, paddingVertical: 2 },
  qtyValue: { fontWeight: "800", fontSize: 13 },
  cardStock: { ...typography.caption, color: colors.success, fontSize: 10 },
  rxBadge: {
    position: "absolute",
    left: 6,
    top: 6,
    backgroundColor: "#0E9F6E",
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rxText: { color: colors.white, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  errorCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.lg, gap: 4 },
  errorRetry: { ...typography.caption, color: colors.primary, fontWeight: "800" },
});