import { StyleSheet, Text, View, ViewProps } from "react-native";
import { FoodItem } from "@/types";
import { spacing, typography } from "@/theme";
import { FoodItemCard } from "@/components/restaurant/FoodItemCard";

type Props = ViewProps & {
  title: string;
  items: FoodItem[];
  onLayoutY: (y: number) => void;
  quantityFor: (foodItemId: string) => number;
  onAdd: (item: FoodItem) => void;
  onIncrement: (item: FoodItem) => void;
  onDecrement: (item: FoodItem) => void;
};

// A single menu category group: heading + its items, laid out with FoodItemCard
// (ADD -> stepper). Reports its vertical offset so the screen can scroll-sync.
export function MenuSection({ title, items, onLayoutY, quantityFor, onAdd, onIncrement, onDecrement, ...rest }: Props) {
  if (!items.length) return null;

  return (
    <View
      {...rest}
      onLayout={(e) => onLayoutY(e.nativeEvent.layout.y)}
    >
      <Text style={styles.title}>{title}</Text>
      <View style={styles.list}>
        {items.map((item) => (
          <FoodItemCard
            key={item.id}
            item={item}
            quantityInCart={quantityFor(item.id)}
            onAdd={() => onAdd(item)}
            onIncrement={() => onIncrement(item)}
            onDecrement={() => onDecrement(item)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, fontSize: 18, paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.sm },
  list: { paddingHorizontal: spacing.xl },
});
