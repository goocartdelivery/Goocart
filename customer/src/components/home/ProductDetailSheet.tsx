import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import { RemoteImage } from "@/components/RemoteImage";
import { Icon } from "@/components/Icon";
import { HOME_RAW_CATEGORIES, serviceConfig } from "@/constants/serviceHome";
import { ServiceType } from "@/types";
import { useProductDetailStore } from "@/store/useProductDetailStore";
import { useServiceFavorites, useServiceHomeStore } from "@/store/useServiceHomeStore";
import { storeProductRef, useStoreCartBill, useStoreCartStore } from "@/store/useStoreCartStore";
import { ServiceProduct } from "@/services/ServiceOrderService";
import { colors, radius, spacing, typography } from "@/theme";

// The backend stores the service as a display string ("Grocery", "Vegetables",
// "Mart"); the app's config/theming keys on the uppercase ServiceType.
const TYPE_BY_SERVICE: Record<string, ServiceType> = {
  Grocery: "GROCERY",
  Vegetables: "VEGETABLES",
  Mart: "MART",
  Medicine: "MEDICINE",
};

function typeFor(service: string): ServiceType {
  return TYPE_BY_SERVICE[service] ?? "GROCERY";
}

function categoryLabel(category: string, type: ServiceType): string {
  const group = HOME_RAW_CATEGORIES[type.toLowerCase() as keyof typeof HOME_RAW_CATEGORIES];
  if (group) {
    const match = group.find((c) => c.key === category);
    if (match) return match.label;
  }
  return category.replace(/\b\w/g, (c) => c.toUpperCase());
}

// Full product detail in a slide-up sheet. Owns a single instance mounted at
// the app root; cards open it via useProductDetailStore.open(product). Quantity
// lives in the shared store cart (addItem/updateQty) so ADD on the card and the
// stepper here stay in sync.
export function ProductDetailSheet() {
  const product = useProductDetailStore((s) => s.product);
  const close = useProductDetailStore((s) => s.close);
  const visible = product != null;
  const translateY = useRef(new Animated.Value(700)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(700);
      Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: true }).start();
    }
  }, [visible, translateY, product?.id]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={close} accessibilityRole="button" accessibilityLabel="Close product details" />
        {product ? <SheetBody product={product} translateY={translateY} onClose={close} /> : null}
      </View>
    </Modal>
  );
}

function SheetBody({ product, translateY, onClose }: { product: ServiceProduct; translateY: Animated.Value; onClose: () => void }) {
  const { width } = useWindowDimensions();
  const sheetWidth = Math.min(width, 520);

  const items = useStoreCartStore((s) => s.items);
  const addItem = useStoreCartStore((s) => s.addItem);
  const updateQty = useStoreCartStore((s) => s.updateQty);
  const bill = useStoreCartBill();

  const type = typeFor(product.service);
  const accent = serviceConfig(type).theme.primary;
  const favorites = useServiceFavorites(type);
  const toggleFavorite = useServiceHomeStore((s) => s.toggleFavorite);

  const line = items.find((i) => i.productId === product.id);
  const qty = line?.quantity ?? 0;
  const inStock = product.stock > 0;
  const lowStock = inStock && product.stock <= 5;
  const hasMrp = product.mrp != null && product.mrp > product.price;
  const offPercent = hasMrp ? Math.round(((product.mrp! - product.price) / product.mrp!) * 100) : 0;
  const favorite = Boolean(favorites[product.id]);

  const inc = () => addItem(storeProductRef(product));
  const dec = () => {
    if (line) updateQty(line.lineId, -1);
  };

  return (
    <Animated.View style={[styles.sheet, { width: sheetWidth, transform: [{ translateY }] }]}>
      <View style={styles.handleWrap}>
        <View style={styles.handle} />
      </View>
      <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close" style={styles.closeBtn}>
        <Icon name="close" size={18} color={colors.dark} />
      </Pressable>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.imageWrap}>
          <RemoteImage uri={product.imageUrl} fallbackLabel={product.name} style={styles.image} contentFit="cover" />
          <Pressable
            onPress={() => toggleFavorite(type, product.id)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={favorite ? "Remove from favorites" : "Add to favorites"}
            style={styles.favBtn}
          >
            <Icon name={favorite ? "heartFilled" : "heart"} size={18} color={favorite ? colors.error : colors.white} />
          </Pressable>
          {hasMrp ? (
            <View style={[styles.discountBadge, { backgroundColor: accent }]}>
              <Text style={styles.discountText}>{offPercent}% OFF</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.metaRow}>
            <Text style={[styles.serviceChip, { color: accent }]}>{serviceConfig(type).tabLabel}</Text>
            {product.category ? <Text style={styles.categoryText}>{categoryLabel(product.category, type)}</Text> : null}
          </View>

          <Text style={styles.name}>{product.name}</Text>
          {product.unit ? <Text style={styles.unit}>{product.unit}</Text> : null}

          <View style={styles.infoRow}>
            {product.rating > 0 ? (
              <View style={styles.infoChip}>
                <Icon name="star" size={13} color={colors.dark} />
                <Text style={styles.infoChipText}>{product.rating.toFixed(1)}</Text>
              </View>
            ) : null}
            {product.vendorName ? <Text style={styles.vendor} numberOfLines={1}>{product.vendorName}</Text> : null}
            {product.eta ? (
              <View style={styles.infoChip}>
                <Icon name="time" size={13} color={colors.muted} />
                <Text style={styles.infoChipText}>{product.eta}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: accent }]}>₹{product.price}</Text>
            {hasMrp ? <Text style={styles.mrp}>₹{product.mrp}</Text> : null}
            <Text style={[styles.stock, { color: inStock ? colors.success : colors.error }]}>
              {!inStock ? "Out of stock" : lowStock ? `Only ${product.stock} left` : "In stock"}
            </Text>
          </View>

          {product.prescriptionRequired ? (
            <View style={styles.rxBlock}>
              <Text style={styles.rxTitle}>Rx · Prescription required</Text>
              <Text style={styles.rxCopy}>This medicine is sold against a valid prescription. You'll confirm this at checkout.</Text>
            </View>
          ) : null}

          {product.description ? (
            <View style={styles.descBlock}>
              <Text style={styles.descTitle}>About this product</Text>
              <Text style={styles.desc}>{product.description}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {qty === 0 ? (
          <Pressable
            onPress={inStock ? inc : undefined}
            disabled={!inStock}
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.name} to cart`}
            style={({ pressed }) => [styles.addFull, { backgroundColor: accent }, pressed && styles.pressed, !inStock && styles.disabled]}
          >
            <Text style={styles.addFullText}>{inStock ? `Add to Cart · ₹${product.price}` : "Out of Stock"}</Text>
          </Pressable>
        ) : (
          <View style={styles.footerRow}>
            <View style={[styles.stepper, { borderColor: accent }]}>
              <Pressable onPress={dec} hitSlop={6} accessibilityRole="button" style={styles.stepBtn} accessibilityLabel={`Decrease ${product.name}`}>
                <Icon name="minus" size={16} color={accent} />
              </Pressable>
              <Text style={styles.qtyVal}>{qty}</Text>
              <Pressable onPress={inc} hitSlop={6} accessibilityRole="button" style={styles.stepBtn} accessibilityLabel={`Increase ${product.name}`}>
                <Icon name="plus" size={16} color={accent} />
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onClose();
                router.push("/(tabs)/cart");
              }}
              style={({ pressed }) => [styles.viewCart, pressed && styles.pressed]}
            >
              <View style={{ alignItems: "flex-start" }}>
                <Text style={styles.viewCartLabel}>View Cart</Text>
                <Text style={styles.viewCartTotal}>₹{bill.total}</Text>
              </View>
              <Icon name="forward" size={16} color={colors.white} />
            </Pressable>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: "hidden",
    maxHeight: "88%",
  },
  handleWrap: { alignItems: "center", paddingTop: spacing.sm, paddingBottom: 2 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, opacity: 0.8 },
  closeBtn: {
    position: "absolute",
    top: spacing.sm + 4,
    right: spacing.md,
    zIndex: 5,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingBottom: spacing.sm },
  imageWrap: { width: "100%", aspectRatio: 1.15, backgroundColor: colors.background },
  image: { width: "100%", height: "100%" },
  favBtn: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  discountBadge: {
    position: "absolute",
    left: spacing.md,
    bottom: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  discountText: { color: colors.white, fontSize: 11, fontWeight: "800", letterSpacing: 0.2 },
  body: { padding: spacing.lg, gap: spacing.sm },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  serviceChip: { fontWeight: "800", fontSize: 12, letterSpacing: 0.3 },
  categoryText: { ...typography.caption, color: colors.muted },
  name: { ...typography.h1, fontSize: 20, lineHeight: 26 },
  unit: { ...typography.body, color: colors.muted },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  infoChip: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: colors.background, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  infoChipText: { fontSize: 12, fontWeight: "700", color: colors.text },
  vendor: { ...typography.caption, color: colors.muted, flex: 1 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm, marginTop: spacing.xs },
  price: { fontSize: 26, fontWeight: "900" },
  mrp: { ...typography.body, color: colors.muted, textDecorationLine: "line-through", fontSize: 15 },
  stock: { ...typography.caption, fontSize: 11, fontWeight: "700", marginLeft: "auto" },
  descBlock: { marginTop: spacing.xs, gap: 4 },
  descTitle: { ...typography.caption, color: colors.muted, fontWeight: "800", letterSpacing: 0.3, textTransform: "uppercase" },
  rxBlock: {
    backgroundColor: "#D1FAE5",
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
    marginTop: spacing.xs,
  },
  rxTitle: { fontSize: 12, fontWeight: "800", color: "#0E9F6E" },
  rxCopy: { ...typography.caption, fontSize: 11, color: "#396053" },
  desc: { ...typography.body, lineHeight: 20 },
  footer: {
    padding: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  addFull: {
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  addFullText: { color: colors.white, fontSize: 15, fontWeight: "800" },
  disabled: { opacity: 0.45 },
  footerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1.25,
    borderRadius: radius.md,
    paddingHorizontal: 6,
    height: 48,
  },
  stepBtn: { width: 30, height: 44, alignItems: "center", justifyContent: "center" },
  qtyVal: { minWidth: 20, textAlign: "center", fontSize: 15, fontWeight: "800", color: colors.dark },
  viewCart: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.dark,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 48,
  },
  pressed: { opacity: 0.85 },
  viewCartLabel: { ...typography.caption, color: "#A1A1AA", fontSize: 11 },
  viewCartTotal: { color: colors.white, fontSize: 16, fontWeight: "900" },
});