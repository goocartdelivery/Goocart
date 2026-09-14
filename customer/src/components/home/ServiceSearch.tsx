import { Pressable } from "react-native";
import { router } from "expo-router";
import { SearchBar } from "@/components/SearchBar";
import { useActiveServiceStore } from "@/store/useActiveServiceStore";
import { useCategorySelectionStore, categoryForService } from "@/store/useCategorySelectionStore";
import { ServiceType } from "@/types";

const PLACEHOLDER: Record<ServiceType, string> = {
  FOOD: "Search for 'Pizza', 'Burger', 'Biryani'...",
  GROCERY: "Search for Milk, Rice, Atta, Oil...",
  VEGETABLES: "Search for Tomato, Potato, Onion...",
  MART: "Search for Bread, Soap, Detergent...",
  MEDICINE: "Search for Calpol, Dolo, ORS...",
  BIKE_TAXI: "Where are you headed?",
  PARCEL: "Where should we pick up from?",
};

// The search bar is per-service: the placeholder changes with the active
// service and tapping it lands in the matching search/booking surface.
export function ServiceSearch() {
  return (
    <Pressable accessibilityRole="button">
      <ServiceSearchInner />
    </Pressable>
  );
}

function ServiceSearchInner() {
  const active = useActiveServiceStore((s) => s.active);
  const selection = useCategorySelectionStore((s) => s.selection);
  const category = categoryForService(selection, "FOOD");

  const onPress = () => {
    if (active === "FOOD") {
      // Carry the selected subcategory so the search screen scopes results to
      // it (e.g. searching within Biryani when Biryani is selected).
      router.push({ pathname: "/(tabs)/search", params: category ? { category: category.key } : undefined });
    } else {
      router.push({ pathname: "/service/[type]", params: { type: active } });
    }
  };
  return <SearchBar placeholder={PLACEHOLDER[active]} editable={false} onPress={onPress} />;
}