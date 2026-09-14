import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Icon } from "@/components/Icon";
import { colors, radius, spacing, typography } from "@/theme";
import { useAuthStore } from "@/store/useAuthStore";
import { useVendorStore } from "@/store/useVendorStore";

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const restaurant = useVendorStore((s) => s.restaurant);
  const menu = useVendorStore((s) => s.menu);

  const signOut = async () => {
    await logout();
    router.replace("/welcome");
  };

  const initials = (user?.name ?? "V")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roleLabel = user?.role === "VENDOR_OWNER" ? "Owner" : user?.staffTitle ?? "Staff";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={typography.h1}>Profile</Text>
      </View>

      {/* Restaurant header */}
      {restaurant && (
        <View style={styles.heroSection}>
          {restaurant.imageUrl ? (
            <Image source={{ uri: restaurant.imageUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroImageEmpty}>
              <Icon name="storefront" size={28} color={colors.muted} />
            </View>
          )}
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.restaurantArea}>{restaurant.area}</Text>
        </View>
      )}

      {/* Profile card */}
      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={typography.h3}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{roleLabel}</Text>
          </View>
        </View>

        {/* Stats row */}
        {restaurant && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{menu.length}</Text>
              <Text style={styles.statLabel}>Menu items</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{restaurant.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{restaurant.ratingCount}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        )}

        {/* Settings list */}
        <View style={styles.settingsCard}>
          <SettingsRow icon="storefront" label="Restaurant details" value={restaurant?.name} />
          <SettingsRow icon="time" label="Delivery time" value={`${restaurant?.deliveryTimeMin}-${restaurant?.deliveryTimeMax} min`} />
          <SettingsRow icon="bag" label="Price for two" value={restaurant?.priceForTwo ? `₹${restaurant.priceForTwo}` : "N/A"} />
        </View>

        <PrimaryButton label="Sign out" variant="outline" onPress={() => void signOut()} />
      </View>
    </SafeAreaView>
  );
}

function SettingsRow({ icon, label, value }: { icon: string; label: string; value?: string }) {
  return (
    <View style={styles.settingsRow}>
      <Icon name={icon as any} size={18} color={colors.muted} />
      <Text style={styles.settingsLabel}>{label}</Text>
      <Text style={styles.settingsValue} numberOfLines={1}>
        {value ?? "—"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxxl },

  /* Restaurant hero */
  heroSection: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  heroImage: { width: 80, height: 80, borderRadius: radius.xl },
  heroImageEmpty: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  restaurantName: { ...typography.h2, marginTop: spacing.sm },
  restaurantArea: typography.caption,

  /* Profile */
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.white, fontWeight: "800", fontSize: 15 },
  email: typography.caption,
  roleBadge: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  roleText: { ...typography.captionStrong, color: colors.primary, textTransform: "uppercase", letterSpacing: 0.5 },

  /* Stats */
  statsRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { ...typography.h2, color: colors.primary },
  statLabel: typography.caption,
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: -4 },

  /* Settings */
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  settingsLabel: { ...typography.body, flex: 1 },
  settingsValue: { ...typography.caption, color: colors.muted, maxWidth: 140 },
});
