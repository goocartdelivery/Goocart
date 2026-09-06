import { useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { checkReorderAvailability, checkServiceReorderAvailability } from "@/services/OrderService";
import { useCartStore } from "@/store/useCartStore";
import { useStoreCartStore } from "@/store/useStoreCartStore";
import { FoodOrder } from "@/types";
import { ServiceOrder } from "@/services/ServiceOrderService";

// Shared by the Orders list and Order Details — both offer "Reorder" and must
// apply identical availability/price rules.
export function useReorder() {
  const [busy, setBusy] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const replaceCartWithItem = useCartStore((s) => s.replaceCartWithItem);
  const storeAdd = useStoreCartStore((s) => s.addItem);
  const storeClear = useStoreCartStore((s) => s.clear);

  // Food reorder. Availability + price are checked against the LIVE menu, and
  // the existing ONE-RESTAURANT-PER-FOOD-CART rule is enforced via the cart's
  // own replace flow (replaceCartWithItem + addItem).
  const reorder = async (order: FoodOrder) => {
    setBusy(true);
    try {
      const { items, unavailable, priceChanged } = await checkReorderAvailability(order);

      if (items.length === 0) {
        Alert.alert("Nothing available", "None of the items from this order are available right now.");
        return;
      }

      const proceed = () => {
        replaceCartWithItem(order.restaurantId, order.restaurantName, items[0]);
        items.slice(1).forEach((line) => addItem(order.restaurantId, order.restaurantName, line));
        router.push("/(tabs)/cart");
      };

      const warnings: string[] = [];
      if (unavailable.length > 0) {
        warnings.push(`${unavailable.length} item${unavailable.length > 1 ? "s" : ""} ${unavailable.length > 1 ? "are" : "is"} unavailable${unavailable.length <= 3 ? `: ${unavailable.join(", ")}` : ""}.`);
      }
      if (priceChanged) warnings.push("Some prices have changed since your last order.");

      if (warnings.length > 0) {
        Alert.alert("Before you reorder", `${warnings.join("\n\n")}\n\nContinue with the current menu?`, [
          { text: "Cancel", style: "cancel" },
          { text: unavailable.length > 0 ? "Continue with Available Items" : "Continue", onPress: proceed },
        ]);
      } else {
        proceed();
      }
    } catch (e) {
      Alert.alert("Couldn't reorder", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // GoCart Store reorder (Grocery / Vegetables / Mart). Availability + prices
  // are checked against the live store catalog; the shared store cart is the
  // only domain touched (independent of the food cart).
  const reorderService = async (order: ServiceOrder) => {
    setBusy(true);
    try {
      const { items, unavailable, priceChanged } = await checkServiceReorderAvailability(order);

      if (items.length === 0) {
        Alert.alert("Nothing available", "None of the items from this order are available right now.");
        return;
      }

      const proceed = () => {
        storeClear();
        items.forEach((ref) => storeAdd(ref));
        router.push("/(tabs)/cart");
      };

      const warnings: string[] = [];
      if (unavailable.length > 0) {
        warnings.push(`${unavailable.length} item${unavailable.length > 1 ? "s" : ""} ${unavailable.length > 1 ? "are" : "is"} unavailable${unavailable.length <= 3 ? `: ${unavailable.join(", ")}` : ""}.`);
      }
      if (priceChanged) warnings.push("Some prices have changed since your last order.");

      if (warnings.length > 0) {
        Alert.alert("Before you reorder", `${warnings.join("\n\n")}\n\nContinue with the available items?`, [
          { text: "Cancel", style: "cancel" },
          { text: unavailable.length > 0 ? "Continue with Available Items" : "Continue", onPress: proceed },
        ]);
      } else {
        proceed();
      }
    } catch (e) {
      Alert.alert("Couldn't reorder", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return { reorder, reorderService, busy };
}
