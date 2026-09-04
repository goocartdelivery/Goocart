import { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import { RemoteImage } from "@/components/RemoteImage";
import { Icon } from "@/components/Icon";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonBlock } from "@/components/SkeletonBlock";
import { HomeCategory, ServiceConfig } from "@/constants/serviceHome";
import { matchesCategory, useServiceFavorites, useServiceHomeStore, useServiceProducts } from "@/store/useServiceHomeStore";
import { storeProductRef, useStoreCartBill, useStoreCartStore } from "@/store/useStoreCartStore";
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

  // All three store services (Grocery/Veg/Mart) share ONE store cart. Each
  // product is added to that same cart, so moving between the sections (or
  // the dedicated vertical screens) never splits or replaces the store cart.
  const storeItems = useStoreCartStore((s) => s.items);
  const addItem = useStoreCartStore((s) => s.addItem);
  const updateQty = useStoreCartStore((s) => s.updateQty);
  const storeCount = useStoreCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const storeBill = useStoreCartBill();
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
        <EmptyState icon="grocery" title={`No ${config.tabLabel.toLowerCase()} items yet`} copy={category ? `Nothing matches "${category.label}" right now.` : "Admin adds live products and stock from the Catalog page."} />
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
              accent={config.theme.primary}
            />
          ))}
        </View>
      )}

      {storeCount > 0 ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/(tabs)/cart")}
          style={({ pressed }) => [styles.checkout, pressed && styles.pressed]}
        >
          <View>
            <Text style={styles.checkoutCount}>{storeCount} product{storeCount > 1 ? "s" : ""} in Store Cart</Text>
            <Text style={styles.checkoutTotal}>₹{storeBill.total}</Text>
          </View>
          <View style={[styles.checkoutBtn, { backgroundColor: config.theme.primary }]}>
            <Text style={styles.checkoutBtnText}>View Cart</Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

function ProductCard({
  product,
  cardWidth,
  qty,
  onInc,
  onDec,
  favorite,
  onToggleFav,
  accent,
}: {
  product: ServiceProduct;
  cardWidth: number;
  qty: number;
  onInc: () => void;
  onDec: () => void;
  favorite: boolean;
  onToggleFav: () => void;
  accent: string;
}) {
  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <View>
        <RemoteImage uri={product.imageUrl} fallbackLabel={product.name} style={styles.cardImage} contentFit="cover" />
        <Pressable style={styles.favBtn} onPress={onToggleFav} hitSlop={8} accessibilityLabel={favorite ? "Remove from favorites" : "Add to favorites"}>
          <Icon name={favorite ? "heartFilled" : "heart"} size={16} color={favorite ? colors.error : colors.white} />
        </Pressable>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.cardDesc} numberOfLines={1}>
          {product.vendorName} • {product.description || product.eta}
        </Text>
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
  errorCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.lg, gap: 4 },
  errorRetry: { ...typography.caption, color: colors.primary, fontWeight: "800" },
  checkout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.dark,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  pressed: { opacity: 0.85 },
  checkoutCount: { ...typography.caption, color: "#A1A1AA", fontSize: 11 },
  checkoutTotal: { color: colors.white, fontSize: 18, fontWeight: "900" },
  checkoutBtn: { paddingHorizontal: spacing.xl, paddingVertical: 10, borderRadius: radius.md },
  checkoutBtnText: { color: colors.white, fontSize: 13, fontWeight: "800" },
});