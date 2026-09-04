import { StyleSheet, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { PrimaryButton } from "@/components/PrimaryButton";

type Props = {
  onExplore: () => void;
};

export function EmptyCart({ onExplore }: Props) {
  return (
    <View style={styles.wrap}>
      <EmptyState
        icon="cart"
        title="Your cart is empty"
        copy="Looks like you haven't added anything yet. Let's find something delicious."
      />
      <PrimaryButton label="Explore Food" onPress={onExplore} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", paddingHorizontal: 24, paddingBottom: 60, gap: 8 },
});
