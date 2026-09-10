import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Icon } from "@/components/Icon";
import { MapLocationPicker } from "@/components/MapLocationPicker";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { mapsSupportedInThisBuild } from "@/config/environment";
import { colors, radius, spacing, typography } from "@/theme";
import { useMapPickStore } from "@/store/useMapPickStore";

// Pin-on-the-map picker for the delivery address form. The structured result
// (coordinates + geocoded text fields) travels back through useMapPickStore
// because expo-router can't pass objects through router.back().
export default function AddressPickerScreen() {
  const { lat, lng } = useLocalSearchParams<{ lat?: string; lng?: string }>();
  const numericLat = Number(lat);
  const numericLng = Number(lng);
  const initialLocation =
    Number.isFinite(numericLat) && Number.isFinite(numericLng) && lat && lng
      ? { latitude: numericLat, longitude: numericLng }
      : null;

  if (!mapsSupportedInThisBuild()) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScreenHeader title="Choose on Map" />
        <View style={styles.unavailableWrap}>
          <View style={styles.unavailableIcon}>
            <Icon name="location" size={28} color={colors.primary} />
          </View>
          <Text style={typography.h2}>Maps are unavailable in this build</Text>
          <Text style={styles.unavailableCopy}>
            {`Google Maps needs a real Android Maps API key to render — the previous build baked in a placeholder, which draws a blank map. Add GOOCART_ANDROID_GOOGLE_MAPS_API_KEY (restricted to package com.goocart.customer) to the EAS environment and rebuild. Until then, use "Use Current Location" on the address form to pin an address.`}
          </Text>
          <PrimaryButton label="Go Back" variant="outline" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="Choose on Map" subtitle="Pan the map to place the pin at your delivery point" />
      <MapLocationPicker
        initialLocation={initialLocation}
        confirmLabel="Confirm delivery location"
        onConfirm={(picked) => {
          useMapPickStore.getState().setResult(picked);
          router.back();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  unavailableWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md },
  unavailableIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  unavailableCopy: { ...typography.body, color: colors.muted, textAlign: "center" },
});