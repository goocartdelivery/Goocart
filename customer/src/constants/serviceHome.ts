import { ImageSourcePropType } from "react-native";
import { ServiceType } from "@/types";
import { FOOD_CATEGORIES } from "@/constants/foodCategories";

// One configuration per service drives the WHOLE homepage. The same
// components consume `serviceConfig(active)` and render different
// hero / search / categories / stores / products / offers / brands for it,
// so nothing is hardcoded per-screen and the app stays a single portal.

export type ServiceKind = "food" | "products" | "job";

export type ServiceTheme = {
  primary: string;
  primaryMuted: string;
  onPrimary: string;
  gradient: [string, string];
  gradientDeep: string;
  accent: string;
  accentSoft: string;
};

export type HomeCategory = {
  key: string;
  label: string;
  imageUrl?: string;
  emoji?: string;
  accent?: string;
  keywords: string[];
};

export type ServiceBrand = { name: string; emoji: string; color: string; image?: ImageSourcePropType };

export type ServiceConfig = {
  type: ServiceType;
  kind: ServiceKind;
  tabLabel: string;
  theme: ServiceTheme;
  hero: {
    image?: ImageSourcePropType;
    kicker: string;
    title: string;
    subtitle: string;
    ctaLabel: string;
    emoji: string;
  };
  searchPlaceholder: string;
  categories: HomeCategory[];
  brands: ServiceBrand[];
};

// Food categories reuse the app's existing curated Unsplash imagery.
function foodCategories(): HomeCategory[] {
  return HOME_RAW_CATEGORIES.food.map((c) => ({
    ...c,
    imageUrl: FOOD_CATEGORIES.find((fc) => fc.id === c.key)?.imageUrl,
  }));
}

export const HOME_RAW_CATEGORIES: Record<"food" | "grocery" | "vegetables" | "mart", HomeCategory[]> = {
  food: [
    { key: "biryani", label: "Biryani", keywords: ["biryani", "rice", "mandi", "dum"] },
    { key: "pizza", label: "Pizza", keywords: ["pizza", "garlic bread"] },
    { key: "burger", label: "Burger", keywords: ["burger", "fries", "combo"] },
    { key: "dosa", label: "South Indian", keywords: ["dosa", "idly", "vada", "masala"] },
    { key: "chicken", label: "Chicken", keywords: ["chicken", "tikka", "fried chicken"] },
    { key: "meals", label: "Meals", keywords: ["meal", "thali", "curry", "roti"] },
    { key: "chinese", label: "Chinese", keywords: ["noodles", "manchurian", "chinese", "schezwan"] },
    { key: "desserts", label: "Desserts", keywords: ["cake", "dessert", "ice cream", "brownie"] },
    { key: "juices", label: "Juices", keywords: ["juice", "mocktail", "shake"] },
    { key: "rolls", label: "Rolls", keywords: ["wrap", "roll", "shawarma", "kebab"] },
  ],
  grocery: [
    { key: "dairy", label: "Dairy & Milk", emoji: "🥛", accent: "#E8F7ED", keywords: ["milk", "curd", "butter", "paneer", "cheese", "yogurt", "ghee"] },
    { key: "fruits", label: "Fruits", emoji: "🍎", accent: "#FFF0E8", keywords: ["apple", "banana", "mango", "orange", "grape", "papaya", "watermelon"] },
    { key: "vegetables", label: "Vegetables", emoji: "🥦", accent: "#EEF8DF", keywords: ["tomato", "onion", "potato", "carrot", "cabbage", "brinjal"] },
    { key: "atta", label: "Atta & Flour", emoji: "🌾", accent: "#FFF4D8", keywords: ["atta", "flour", "maida", "besan", "sooji"] },
    { key: "rice", label: "Rice & Grains", emoji: "🍚", accent: "#FFF4D8", keywords: ["rice", "bajra", "jowar", "oats"] },
    { key: "pulses", label: "Pulses", emoji: "🫘", accent: "#FDE7D8", keywords: ["dal", "moong", "masoor", "chana", "toor", "urad"] },
    { key: "oil", label: "Cooking Oil", emoji: "🫗", accent: "#FFF4D8", keywords: ["oil", "sunflower", "groundnut", "mustard"] },
    { key: "spices", label: "Spices", emoji: "🌶️", accent: "#FDE7D8", keywords: ["masala", "turmeric", "chilli", "salt", "cumin", "garam"] },
    { key: "snacks", label: "Snacks", emoji: "🍿", accent: "#FFF0E8", keywords: ["chips", "namkeen", "bhujia", "kurkure", "wafers"] },
    { key: "biscuits", label: "Biscuits", emoji: "🍪", accent: "#FFF8E1", keywords: ["biscuit", "cookie", "marie", "parle", "bourbon"] },
    { key: "beverages", label: "Beverages", emoji: "🧃", accent: "#E8F7ED", keywords: ["coffee", "tea", "juice", "cola", "soda", "water"] },
    { key: "breakfast", label: "Breakfast", emoji: "🥣", accent: "#FFF8E1", keywords: ["corn", "flakes", "poha", "upma", "bread", "oats"] },
    { key: "bakery", label: "Bakery", emoji: "🥖", accent: "#FFE9D6", keywords: ["bread", "cake", "bun", "rusk", "pav"] },
    { key: "frozen", label: "Frozen Foods", emoji: "🧊", accent: "#E4F3FB", keywords: ["ice cream", "frozen", "nuggets", "samosa"] },
    { key: "cleaning", label: "Cleaning", emoji: "🧴", accent: "#E4F3FB", keywords: ["detergent", "clean", "dishwash", "surface", "floor"] },
    { key: "personal", label: "Personal Care", emoji: "🧼", accent: "#F3E8FF", keywords: ["shampoo", "soap", "toothpaste", "cream", "lotion"] },
    { key: "baby", label: "Baby Care", emoji: "🍼", accent: "#FFE9F1", keywords: ["diaper", "baby", "wipes"] },
    { key: "pet", label: "Pet Supplies", emoji: "🐾", accent: "#E8F7ED", keywords: ["pet", "dog", "cat", "food"] },
  ],
  vegetables: [
    { key: "leafy", label: "Leafy Vegetables", emoji: "🥬", accent: "#E8F7ED", keywords: ["spinach", "palak", "coriander", "methi", "lettuce", "amaranth"] },
    { key: "root", label: "Root Vegetables", emoji: "🥔", accent: "#FFF4D8", keywords: ["potato", "carrot", "radish", "beetroot", "turnip"] },
    { key: "fruits", label: "Fresh Fruits", emoji: "🍎", accent: "#FFF0E8", keywords: ["apple", "banana", "mango", "orange", "grapes", "papaya", "guava"] },
    { key: "exotic", label: "Exotic Vegetables", emoji: "🥦", accent: "#F3E8FF", keywords: ["broccoli", "capsicum", "zucchini", "mushroom", "corn"] },
    { key: "herbs", label: "Herbs", emoji: "🌿", accent: "#E8F7ED", keywords: ["mint", "basil", "thyme", "rosemary", "curry leaves"] },
    { key: "organic", label: "Organic Produce", emoji: "🌱", accent: "#DCFCE7", keywords: ["organic", "natural", "fresh"] },
  ],
  mart: [
    { key: "household", label: "Household", emoji: "🏠", accent: "#F3E8FF", keywords: ["lamp", "battery", "bulb", "wrapper", "foil"] },
    { key: "personal", label: "Personal Care", emoji: "🧼", accent: "#FFE9F1", keywords: ["shampoo", "soap", "toothpaste", "deodorant"] },
    { key: "beauty", label: "Beauty", emoji: "💄", accent: "#FFE9F1", keywords: ["cream", "lipstick", "serum", "face"] },
    { key: "cleaning", label: "Cleaning", emoji: "🧹", accent: "#E4F3FB", keywords: ["detergent", "clean", "dishwash", "mop", "broom"] },
    { key: "stationery", label: "Stationery", emoji: "✏️", accent: "#F3E8FF", keywords: ["pen", "notebook", "marker", "tape"] },
    { key: "electronics", label: "Electronics", emoji: "🔌", accent: "#E4F3FB", keywords: ["charger", "cable", "earphone", "battery", "adapter"] },
    { key: "kitchen", label: "Kitchen", emoji: "🍳", accent: "#FFF0E8", keywords: ["oil", "masala", "utensil", "kadai", "pan"] },
    { key: "homeEssentials", label: "Home Essentials", emoji: "🛋️", accent: "#F3E8FF", keywords: ["towel", "bed", "pillow", "cup", "plate"] },
    { key: "baby", label: "Baby Care", emoji: "🍼", accent: "#FFE9F1", keywords: ["diaper", "baby", "wipes"] },
    { key: "pet", label: "Pet Supplies", emoji: "🐾", accent: "#E8F7ED", keywords: ["pet", "dog", "cat", "food"] },
  ],
};

export const HOME_BRANDS: Record<ServiceType, ServiceBrand[]> = {
  FOOD: [
    { name: "McDonald's", emoji: "🍔", color: "#FFC72C", image: require("../../assets/images/macd.jpg") },
    { name: "KFC", emoji: "🍗", color: "#E4002B", image: require("../../assets/images/kfc.png") },
    { name: "Domino's", emoji: "🍕", color: "#E31837", image: require("../../assets/images/dominos.webp") },
    { name: "Starbucks", emoji: "☕", color: "#00704A", image: require("../../assets/images/starbuks.webp") },
    { name: "Pizza Hut", emoji: "🍕", color: "#E31837", image: require("../../assets/images/pizzahuts.webp") },
    { name: "Haldiram's", emoji: "🥟", color: "#C8102E", image: require("../../assets/images/haldiraam.webp") },
  ],
  GROCERY: [
    { name: "Amul", emoji: "🥛", color: "#1D4ED8" },
    { name: "Nestlé", emoji: "🍫", color: "#B45309" },
    { name: "Britannia", emoji: "🍪", color: "#BE185D" },
    { name: "Tata", emoji: "🧉", color: "#0F766E" },
    { name: "Fortune", emoji: "🫗", color: "#A16207" },
    { name: "Aashirvaad", emoji: "🌾", color: "#B91C1C" },
    { name: "Surf Excel", emoji: "🧺", color: "#1D4ED8" },
    { name: "Dove", emoji: "🧴", color: "#047857" },
  ],
  VEGETABLES: [
    { name: "Local Farms", emoji: "🧑‍🌾", color: "#15803D" },
    { name: "Organic Valley", emoji: "🌱", color: "#4D7C0F" },
    { name: "Farm Fresh", emoji: "🥬", color: "#16A34A" },
    { name: "Green Basket", emoji: "🧺", color: "#047857" },
  ],
  MART: [
    { name: "Colgate", emoji: "🪥", color: "#DC2626" },
    { name: "Tide", emoji: "🧺", color: "#2563EB" },
    { name: "Vim", emoji: "🧽", color: "#16A34A" },
    { name: "Real", emoji: "🧃", color: "#EA580C" },
    { name: "Bru", emoji: "☕", color: "#7C3AED" },
    { name: "Pampers", emoji: "🍼", color: "#F59E0B" },
  ],
  BIKE_TAXI: [],
  PARCEL: [],
};

export const SERVICE_CONFIGS: Record<ServiceType, ServiceConfig> = {
  FOOD: {
    type: "FOOD",
    kind: "food",
    tabLabel: "Food",
    theme: {
      primary: "#FF6B35",
      primaryMuted: "#FFE8DD",
      onPrimary: "#FFFFFF",
      gradient: ["#FF7A3C", "#FF6B35"],
      gradientDeep: "#E9551F",
      accent: "#FFC72C",
      accentSoft: "#FFF3C9",
    },
    hero: {
      image: require("../../assets/images/banners/foodbanner.webp"),
      kicker: "FREE DELIVERY THIS WEEK",
      title: "Hungry? We deliver in minutes.",
      subtitle: "Biryani, pizzas, burgers and more from restaurants near you.",
      ctaLabel: "Order food",
      emoji: "🍔",
    },
    searchPlaceholder: "Search for 'Pizza', 'Burger', 'Biryani'...",
    categories: foodCategories(),
    brands: HOME_BRANDS.FOOD,
  },
  GROCERY: {
    type: "GROCERY",
    kind: "products",
    tabLabel: "Grocery",
    theme: {
      primary: "#16A34A",
      primaryMuted: "#DCFCE7",
      onPrimary: "#FFFFFF",
      gradient: ["#22C55E", "#16A34A"],
      gradientDeep: "#15803D",
      accent: "#FACC15",
      accentSoft: "#FEF9C3",
    },
    hero: {
      image: require("../../assets/images/banners/grocerybanner.webp"),
      kicker: "ALL YOUR DAILY ESSENTIALS",
      title: "Groceries at your doorstep.",
      subtitle: "Milk, rice, atta, oil and more — delivered in under 45 minutes.",
      ctaLabel: "Shop groceries",
      emoji: "🛒",
    },
    searchPlaceholder: "Search for Milk, Rice, Atta, Oil...",
    categories: HOME_RAW_CATEGORIES.grocery,
    brands: HOME_BRANDS.GROCERY,
  },
  VEGETABLES: {
    type: "VEGETABLES",
    kind: "products",
    tabLabel: "Vegetables",
    theme: {
      primary: "#15803D",
      primaryMuted: "#E8F7ED",
      onPrimary: "#FFFFFF",
      gradient: ["#4ADE80", "#22A54A"],
      gradientDeep: "#166534",
      accent: "#86EFAC",
      accentSoft: "#DCFCE7",
    },
    hero: {
      image: require("../../assets/images/banners/grocerybanner.webp"),
      kicker: "FARM FRESH, EVERY DAY",
      title: "Fresh produce, picked for you.",
      subtitle: "Tomatoes, potatoes, leafy greens and seasonal fruits, at best prices.",
      ctaLabel: "Shop vegetables",
      emoji: "🥬",
    },
    searchPlaceholder: "Search for Tomato, Potato, Onion...",
    categories: HOME_RAW_CATEGORIES.vegetables,
    brands: HOME_BRANDS.VEGETABLES,
  },
  MART: {
    type: "MART",
    kind: "products",
    tabLabel: "Mart",
    theme: {
      primary: "#7C3AED",
      primaryMuted: "#EDE9FE",
      onPrimary: "#FFFFFF",
      gradient: ["#8B5CF6", "#7C3AED"],
      gradientDeep: "#6D28D9",
      accent: "#FDE047",
      accentSoft: "#FEF9C3",
    },
    hero: {
      image: require("../../assets/images/banners/martbanner.webp"),
      kicker: "EVERYTHING YOUR HOME NEEDS",
      title: "Everyday buys, quick delivery.",
      subtitle: "Household, personal care, cleaning and daily-use items near you.",
      ctaLabel: "Shop at Mart",
      emoji: "🛍️",
    },
    searchPlaceholder: "Search for Bread, Soap, Detergent...",
    categories: HOME_RAW_CATEGORIES.mart,
    brands: HOME_BRANDS.MART,
  },
  BIKE_TAXI: {
    type: "BIKE_TAXI",
    kind: "job",
    tabLabel: "Bike Taxi",
    theme: {
      primary: "#EAB308",
      primaryMuted: "#FEF9C3",
      onPrimary: "#18181B",
      gradient: ["#FACC15", "#EAB308"],
      gradientDeep: "#CA8A04",
      accent: "#18181B",
      accentSoft: "#27272A",
    },
    hero: {
      image: require("../../assets/images/banners/taxibanner.webp"),
      kicker: "RIDES FROM ₹29",
      title: "Hop on. Get there fast.",
      subtitle: "Book a bike ride to anywhere in the city — affordable and quick.",
      ctaLabel: "Book a ride",
      emoji: "🛵",
    },
    searchPlaceholder: "Where are you headed?",
    categories: [],
    brands: [],
  },
  PARCEL: {
    type: "PARCEL",
    kind: "job",
    tabLabel: "Parcel",
    theme: {
      primary: "#2B82D9",
      primaryMuted: "#E4F1FB",
      onPrimary: "#FFFFFF",
      gradient: ["#3E9BF2", "#2B82D9"],
      gradientDeep: "#1E64A8",
      accent: "#FF8A4C",
      accentSoft: "#FFE8DD",
    },
    hero: {
      kicker: "SEND ANYTHING, ANYWHERE",
      title: "Parcel delivered, door to door.",
      subtitle: "Books, documents, shopping — sent across town in hours.",
      ctaLabel: "Send a parcel",
      emoji: "📦",
    },
    searchPlaceholder: "Where should we pick up from?",
    categories: [],
    brands: [],
  },
};

export const serviceConfig = (type: ServiceType): ServiceConfig => SERVICE_CONFIGS[type];