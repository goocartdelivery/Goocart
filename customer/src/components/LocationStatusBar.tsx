import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocationStore } from "@/store/useLocationStore";

// Small, premium, read-only location indicator for the Welcome/Sign-In
// screens. Renders one of four states — fetching, delivering-to, or an
// unavailable reason with a tappable action (enable / open settings / retry).
// Screens decide when detection runs; this component never prompts on its own.
export function LocationStatusBar() {
  const selected = useLocationStore((s) => s.selected);
  const status = useLocationStore((s) => s.status);
  const statusReason = useLocationStore((s) => s.statusReason);
  const detectCurrentLocation = useLocationStore((s) => s.detectCurrentLocation);

  if (status === "fetching") {
    return (
      <View style={styles.container} accessibilityLabel="Fetching your location">
        <ActivityIndicator size="small" color="#F4512A" />
        <Text style={styles.message} numberOfLines={1}>
          Fetching your location…
        </Text>
      </View>
    );
  }

  if (selected) {
    return (
      <View style={styles.container} accessibilityLabel={`Delivering to ${selected.address}`}>
        <Ionicons name="location" size={15} color="#F4512A" />
        <Text style={styles.message} numberOfLines={1}>
          Delivering to {selected.address}
        </Text>
      </View>
    );
  }

  if (status === "unavailable") {
    switch (statusReason) {
      case "permission":
        return (
          <Pressable
            accessibilityRole="button"
            onPress={() => void detectCurrentLocation(true)}
            style={({ pressed }) => [styles.container, pressed && styles.pressed]}
          >
            <Ionicons name="location-outline" size={15} color="#8B8B98" />
            <Text style={styles.message} numberOfLines={1}>
              Location unavailable
            </Text>
            <Text style={styles.action}>Enable location</Text>
          </Pressable>
        );
      case "permanently-denied":
        return (
          <Pressable
            accessibilityRole="button"
            onPress={() => void Linking.openSettings()}
            style={({ pressed }) => [styles.container, pressed && styles.pressed]}
          >
            <Ionicons name="alert-circle-outline" size={15} color="#8B8B98" />
            <Text style={styles.message} numberOfLines={1}>
              Location permission is off
            </Text>
            <Text style={styles.action}>Open settings</Text>
          </Pressable>
        );
      case "services-disabled":
        return (
          <Pressable
            accessibilityRole="button"
            onPress={() => void Linking.openSettings()}
            style={({ pressed }) => [styles.container, pressed && styles.pressed]}
          >
            <Ionicons name="navigate-outline" size={15} color="#8B8B98" />
            <Text style={styles.message} numberOfLines={1}>
              Turn on location to find nearby services
            </Text>
            <Text style={styles.action}>Open settings</Text>
          </Pressable>
        );
      default:
        // timeout or generic failure — always retriable.
        return (
          <Pressable
            accessibilityRole="button"
            onPress={() => void detectCurrentLocation(true)}
            style={({ pressed }) => [styles.container, pressed && styles.pressed]}
          >
            <Ionicons name="location-outline" size={15} color="#8B8B98" />
            <Text style={styles.message} numberOfLines={1}>
              Couldn&apos;t detect your location
            </Text>
            <Text style={styles.action}>Try again</Text>
          </Pressable>
        );
    }
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0EFF2",
    paddingHorizontal: 12,
    paddingVertical: 7,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  pressed: { opacity: 0.85 },
  message: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
    color: "#1A1A2E",
  },
  action: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F4512A",
  },
});