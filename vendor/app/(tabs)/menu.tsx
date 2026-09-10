import { useEffect } from "react";
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { VegBadge } from "@/components/VegBadge";
import { SkeletonMenuCard } from "@/components/SkeletonLoader";
import { colors, radius, spacing, typography } from "@/theme";
import { useVendorStore } from "@/store/useVendorStore";
import { FoodItem } from "@/types";

export default function MenuScreen() {
  const { restaurant, menu, loading, error, loadMenu, updateMenuItem } = useVendorStore();

  useEffect(() => {
    void loadMenu();
  }, [loadMenu]);

  const toggleAvailable = async (item: FoodItem) => {
    try {
      await updateMenuItem(item.id, { available: !item.available });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={typography.h1}>Menu</Text>
          {menu.length > 0 && <Text style={styles.headerSub}>{menu.length} items</Text>}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/menu/new")}
          style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
          disabled={!restaurant}
        >
          <Icon name="add" size={22} color={restaurant ? colors.white : colors.border} />
          <Text style={[styles.addBtnText, !restaurant && { color: colors.border }]}>Add</Text>
        </Pressable>
      </View>
      <FlatList
        data={menu}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void loadMenu()} />}
        ListEmptyComponent={
          !restaurant ? (
            <EmptyState icon="storefront" title="No restaurant yet" copy="An admin needs to link your account before you can add dishes." />
          ) : loading ? (
            <View style={styles.content}>
              <SkeletonMenuCard />
              <SkeletonMenuCard />
              <SkeletonMenuCard />
            </View>
          ) : (
            <EmptyState icon="menu" title="Your menu is empty" copy="Tap + to add your first dish." />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: "/menu/[id]", params: { id: item.id } })}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.cardRow}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.thumb} resizeMode="cover" />
              ) : (
                <View style={styles.thumbEmpty}>
                  <Icon name="image" size={20} color={colors.muted} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <VegBadge veg={item.veg} />
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                <Text style={styles.price}>₹{item.price}</Text>
              </View>
              <View style={styles.toggleWrap}>
                <Text style={[styles.availLabel, { color: item.available ? colors.success : colors.muted }]}>
                  {item.available ? "In stock" : "Sold out"}
                </Text>
                <Switch
                  value={item.available}
                  onValueChange={() => void toggleAvailable(item)}
                  trackColor={{ false: colors.border, true: colors.successMuted }}
                  thumbColor={item.available ? colors.success : colors.surface}
                />
              </View>
            </View>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerSub: { ...typography.caption, marginTop: 2 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 4,
  },
  addBtnPressed: { opacity: 0.8 },
  addBtnText: { ...typography.button, fontSize: 13 },
  content: { padding: spacing.xl, flexGrow: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: { opacity: 0.85 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  thumb: { width: 56, height: 56, borderRadius: radius.md },
  thumbEmpty: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  itemName: { ...typography.bodyStrong, flex: 1 },
  price: { ...typography.bodyStrong, color: colors.primary, marginTop: 4 },
  toggleWrap: { alignItems: "flex-end", gap: 4 },
  availLabel: { ...typography.captionStrong },
  error: { ...typography.caption, color: colors.error, textAlign: "center", paddingBottom: spacing.md },
});
