import { StyleSheet, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { PrimaryButton } from "@/components/PrimaryButton";

type Props =
  | { mode?: "food"; onExplore: () => void }
  | { mode: "store"; onExplore: () => void };

// Separate premium empty states for the Food cart and the Go/Store cart.
export function EmptyCart({ mode = "food", onExplore }: Props) {
  const isStore = mode === "store";
  return (
    <View style={styles.wrap}>
      <EmptyState
        icon={isStore ? "grocery" : "food"}
        title={isStore ? "Your Go Cart is empty" : "Your food cart is empty"}
        copy={isStore ? "Shop groceries, vegetables & essentials — all in one place." : "Discover delicious food near you and add your favourites."}
      />
      <PrimaryButton label={isStore ? "Start Shopping" : "Explore Food"} onPress={onExplore} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", paddingHorizontal: 24, paddingBottom: 60, gap: 8 },
});
