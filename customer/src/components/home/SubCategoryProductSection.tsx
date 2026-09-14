import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { RemoteImage } from "@/components/RemoteImage";
import { Icon } from "@/components/Icon";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonBlock } from "@/components/SkeletonBlock";
import { HomeCategory, ServiceConfig } from "@/constants/serviceHome";
import { useCategoryProducts, useServiceFavorites, useServiceHomeStore } from "@/store/useServiceHomeStore";
import { useProductDetailStore } from "@/store/useProductDetailStore";
import { storeProductRef, useStoreCartStore } from "@/store/useStoreCartStore";
import { ServiceProduct } from "@/services/ServiceOrderService";
import { colors, radius, spacing, typography } from "@/theme";

type Props = {
  config: ServiceConfig;
  category: HomeCategory;
};

// The subcategory-selected content area for Grocery/Veg/Mart. Backed by the
// store's per-(service, category) cache so switching subcategories shows a
// fresh loading skeleton instead of the previous subcategory's results.
export function SubCategoryProductSection({ config, category }: Props) {
  const service = config.type;
  const products = useCategoryProducts(service, category.key);
  const state = useServiceHomeStore((s) => s.categoryProductsState[service]?.[category.key] ?? "idle");
  const errorMessage = useServiceHomeStore((s) => s.categoryProductsError[service]?.[category.key]);
  const load = useServiceHomeStore((s) => s.loadCategoryProducts);
  const favorites = useServiceFavorites(service);
  const toggleFavorite = useServiceHomeStore((s) => s.toggleFavorite);
  const openProduct = useProductDetailStore((s) => s.open);

  const storeItems = useStoreCartStore((s) => s.items);
  const addItem = useStoreCartStore((s) => s.addItem);
  const updateQty = useStoreCartStore((s) => s.updateQty);

  const [query, setQuery] = useState("");
  const { cardWidth } = useCardWidth();

  useEffect(() => {
    setQuery("");
    void load(service, category.key);
  }, [service, category.key, load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(q));
  }, [products, query]);

  const loading = state === "idle" || state === "loading";
  const error = state === "error";

  const onRetry = () => void load(service, category.key, true);

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <View style={[styles.headIcon, { backgroundColor: category.accent ?? config.theme.primaryMuted }]}>
          <Text style={styles.headEmoji}>{category.emoji ?? "🛒"}</Text>
        </View>
        <View style={styles.headText}>
          <Text style={styles.title}>{category.label}</Text>
          <Text style={styles.subtitle}>
            {loading ? "Loading items…" : error ? "Could not load items" : `${products.length} item${products.length === 1 ? "" : "s"} • in stock`}
          </Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Icon name="search" size={16} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={`Search within ${category.label}`}
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          autoCorrect={false}
          accessibilityLabel={`Search within ${category.label}`}
        />
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={typography.bodyStrong}>Couldn\u2019t load {category.label.toLowerCase()} items</Text>
          {errorMessage ? <Text style={styles.errorDetail}>{errorMessage}</Text> : null}
          <Pressable onPress={onRetry} accessibilityRole="button">
            <Text style={styles.retry}>Tap to retry</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <GridSkeleton cardWidth={cardWidth} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={config.type === "MEDICINE" ? "medical" : config.type === "GROCERY" ? "grocery" : config.type === "MART" ? "mart" : "vegetables"}
            title={query ? `No matches for "${query}"` : `No ${category.label.toLowerCase()} available`}
            copy={query ? "Try a different search term." : "Live items and stock are added by admin. Check back soon."}
          />
        </View>
      ) : (
        <View style={styles.grid}>
          {filtered.map((p) => (
            <SubCategoryProductCard
              key={p.id}
              config={config}
              product={p}
              cardWidth={cardWidth}
              qty={qtyFor(storeItems, p.id)}
              favorite={Boolean(favorites[p.id])}
              onOpen={() => openProduct(p)}
              onToggleFav={() => toggleFavorite(service, p.id)}
              onInc={() => addItem(storeProductRef(p))}
              onDec={() => {
                const line = storeItems.find((i) => i.productId === p.id);
                if (line) updateQty(line.lineId, -1);
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function qtyFor(items: { productId: string; quantity: number }[], productId: string): number {
  return items.find((i) => i.productId === productId)?.quantity ?? 0;
}

function useCardWidth(): { cardWidth: number } {
  const { width } = useWindowDimensions();
  const cardWidth = Math.floor((Math.min(width, 1080) - spacing.lg * 2 - spacing.md) / 2);
  return { cardWidth };
}

function SubCategoryProductCard({
  config,
  product,
  cardWidth,
  qty,
  favorite,
  onToggleFav,
  onInc,
  onDec,
  onOpen,
}: {
  config: ServiceConfig;
  product: ServiceProduct;
  cardWidth: number;
  qty: number;
  favorite: boolean;
  onToggleFav: () => void;
  onInc: () => void;
  onDec: () => void;
  onOpen: () => void;
}) {
  const accent = config.theme.primary;
  const hasMrp = product.mrp != null && product.mrp > product.price;
  const offPercent = hasMrp ? Math.round(((product.mrp! - product.price) / product.mrp!) * 100) : 0;

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`View ${product.name}`}>
        <RemoteImage uri={product.imageUrl} fallbackLabel={product.name} style={styles.cardImage} contentFit="cover" />
        <Pressable
          style={styles.favBtn}
          onPress={onToggleFav}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={favorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Icon name={favorite ? "heartFilled" : "heart"} size={16} color={favorite ? colors.error : colors.white} />
        </Pressable>
        {hasMrp ? (
          <View style={[styles.discountBadge, { backgroundColor: accent }]}>
            <Text style={styles.discountText}>{offPercent}% OFF</Text>
          </View>
        ) : null}
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
          {product.unit ? (
            <Text style={styles.cardUnit} numberOfLines={1}>
              {product.unit}
            </Text>
          ) : null}
        </Pressable>
        <View style={styles.cardPriceRow}>
          <View style={styles.priceCol}>
            <Text style={[styles.cardPrice, { color: accent }]}>₹{product.price}</Text>
            {hasMrp ? <Text style={styles.cardMrp}>₹{product.mrp}</Text> : null}
          </View>
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
      </View>
    </View>
  );
}

function GridSkeleton({ cardWidth }: { cardWidth: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={{ width: cardWidth }}>
          <SkeletonBlock width="100%" height={140} style={styles.skImage} />
          <View style={{ padding: spacing.sm, gap: 6 }}>
            <SkeletonBlock width="85%" height={12} />
            <SkeletonBlock width="50%" height={10} />
            <SkeletonBlock width="45%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg },
  headIcon: { width: 46, height: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  headEmoji: { fontSize: 24 },
  headText: { flex: 1, minWidth: 0 },
  title: { ...typography.h2 },
  subtitle: { ...typography.caption, color: colors.muted, marginTop: 2 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, ...typography.body, fontSize: 13, color: colors.text },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, paddingHorizontal: spacing.lg },
  card: {
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  cardImage: { width: "100%", aspectRatio: 1 },
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
  discountBadge: {
    position: "absolute",
    left: 6,
    bottom: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  discountText: { color: colors.white, fontSize: 10, fontWeight: "800", letterSpacing: 0.2 },
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
  cardBody: { padding: spacing.sm, gap: 2 },
  cardName: { ...typography.bodyStrong, fontSize: 13 },
  cardUnit: { ...typography.caption, color: colors.muted, fontSize: 10.5 },
  cardPriceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  priceCol: { flexDirection: "row", alignItems: "baseline", gap: 5 },
  cardPrice: { fontSize: 16, fontWeight: "900" },
  cardMrp: { ...typography.caption, color: colors.muted, textDecorationLine: "line-through", fontSize: 11 },
  addBtn: { borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.sm },
  addBtnText: { fontSize: 11, fontWeight: "800" },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 4, paddingVertical: 2 },
  qtyBtn: { paddingHorizontal: 3, paddingVertical: 2 },
  qtyValue: { fontWeight: "800", fontSize: 13 },
  skImage: { borderRadius: 0 },
  errorCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  retry: { ...typography.caption, color: colors.primary, fontWeight: "800" },
  errorDetail: { ...typography.caption, color: colors.error, fontSize: 10.5 },
  emptyWrap: { paddingHorizontal: spacing.lg },
});