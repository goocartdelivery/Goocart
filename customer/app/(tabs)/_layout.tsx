import { Platform, View } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "@/theme";
import { Icon, IconName } from "@/components/Icon";
import { useCartItemCount } from "@/store/useCartStore";
import { useStoreCartItemCount } from "@/store/useStoreCartStore";
import { ActiveOrderBar } from "@/orders/ActiveOrderBar";
import { GroceryStickyCartBar } from "@/components/home/GroceryStickyCartBar";

const TAB_BAR_CONTENT_HEIGHT = 58;

export default function TabsLayout() {
  const cartCount = useCartItemCount();
  const storeCartCount = useStoreCartItemCount();
  const badgeCount = cartCount + storeCartCount;
  // Android gesture navigation and iPhone home indicators both eat into the
  // bottom edge; without this the tab bar sits under the system bar.
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === "android" ? 8 : 0);

  const tab = (name: string, title: string, icon: IconName, activeIcon: IconName) => (
    <Tabs.Screen
      key={name}
      name={name}
      options={{
        title,
        tabBarIcon: ({ focused }) => <Icon name={focused ? activeIcon : icon} size={22} color={focused ? colors.primary : colors.muted} />,
        ...(name === "cart" ? { tabBarBadge: badgeCount > 0 ? badgeCount : undefined } : {}),
      }}
    />
  );

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: { fontSize: 12, fontWeight: "600", marginTop: 2 },
          tabBarItemStyle: { paddingVertical: 4 },
          tabBarBadgeStyle: { backgroundColor: colors.primary, color: colors.white, fontSize: 10, fontWeight: "700", minWidth: 18, height: 18 },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: TAB_BAR_CONTENT_HEIGHT + bottomInset,
            paddingBottom: bottomInset,
            paddingTop: 8,
            elevation: 8,
          },
        }}
      >
        {tab("home", "Home", "home", "homeActive")}
        {tab("search", "Search", "search", "search")}
        {tab("activity", "Orders", "activity", "activityActive")}
        {tab("cart", "Cart", "cart", "cartActive")}
        {tab("account", "Account", "account", "accountActive")}
      </Tabs>
      {/* Floating active-order bar — sits above the bottom nav, across all tabs
          (hierarchy: content → bar → tab bar → safe area). Only appears while
          an order is live; delivered/cancelled orders hide it. */}
      <ActiveOrderBar bottomOffset={TAB_BAR_CONTENT_HEIGHT + bottomInset + 12} />
      {/* Sticky grocery/store cart bar. Sits above ActiveOrderBar so checkout
          is always the most directly reachable action. Offsets are stacked:
          tab bar (58+inset) → 12 gap → ActiveOrder (≈56px est.) → 8 gap → cart bar. */}
      <GroceryStickyCartBar bottomOffset={TAB_BAR_CONTENT_HEIGHT + bottomInset + 12 + 60 + spacing.sm} />
    </View>
  );
}
