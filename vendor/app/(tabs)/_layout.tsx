import { Platform, StyleSheet, Text, View } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius } from "@/theme";
import { Icon, IconName } from "@/components/Icon";
import { RequireVendor } from "@/components/AuthGates";
import { useOrdersStore } from "@/store/useOrdersStore";

const ACTIVE_STATUSES = ["PLACED", "VENDOR_ACCEPTED", "PREPARING"];
const TAB_BAR_CONTENT_HEIGHT = 58;

function OrderBadge() {
  const orders = useOrdersStore((s) => s.orders);
  const count = orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;

  if (count === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === "android" ? 8 : 0);

  // Badge = orders waiting for action (PLACED), kept live by the global
  // realtime hook refreshing the orders store on every order event.
  const pendingCount = useOrdersStore((s) => s.orders.filter((o) => o.status === "PLACED").length);

  const tab = (name: string, title: string, icon: IconName, activeIcon: IconName) => (
    <Tabs.Screen
      key={name}
      name={name}
      options={{
        title,
        tabBarIcon: ({ focused }) => (
          <View>
            <Icon name={focused ? activeIcon : icon} size={22} color={focused ? colors.primary : colors.muted} />
          </View>
        ),
      }}
    />
  );

  return (
    <RequireVendor>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: { fontSize: 10, fontWeight: "700", marginTop: 2 },
          tabBarItemStyle: { paddingVertical: 4 },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: TAB_BAR_CONTENT_HEIGHT + bottomInset,
            paddingBottom: bottomInset,
            paddingTop: 6,
            elevation: 8,
          },
        }}
      >
        {tab("home", "Home", "home", "homeActive")}
        <Tabs.Screen
          name="orders"
          options={{
            title: "Orders",
            tabBarIcon: ({ focused }) => <Icon name={focused ? "ordersActive" : "orders"} size={22} color={focused ? colors.primary : colors.muted} />,
            tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
            tabBarBadgeStyle: { backgroundColor: colors.primary, color: colors.white, fontSize: 10, fontWeight: "700" },
          }}
        />
        {tab("menu", "Menu", "menu", "menuActive")}
        {tab("analytics", "Analytics", "analytics", "analyticsActive")}
        {tab("profile", "Profile", "account", "accountActive")}
      </Tabs>
    </RequireVendor>
  );
}

const styles = StyleSheet.create({
  tabLabel: { fontSize: 10, fontWeight: "700", marginTop: 2 },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 14,
  },
});
