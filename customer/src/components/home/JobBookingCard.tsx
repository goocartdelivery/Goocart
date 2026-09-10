import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Icon } from "@/components/Icon";
import { PrimaryButton } from "@/components/PrimaryButton";
import { FareOverlay } from "@/components/FareOverlay";
import { RideMapPreview } from "@/components/RideMapPreview";
import { ServiceConfig } from "@/constants/serviceHome";
import { serviceOrderService, FarePreview, ServicePricing } from "@/services/ServiceOrderService";
import { useAuthStore } from "@/store/useAuthStore";
import { useRideBookingStore, RideLocation } from "@/store/useRideBookingStore";
import { useAddressStore } from "@/store/useAddressStore";
import { colors, radius, spacing, typography } from "@/theme";

let pricingCache: ServicePricing | null = null;
let pricingPromise: Promise<ServicePricing | null> | null = null;

async function servicePricing(label: string): Promise<ServicePricing | null> {
  if (pricingCache) return pricingCache;
  if (!pricingPromise) {
    pricingPromise = serviceOrderService
      .configuration()
      .then((config) => {
        pricingCache = config.pricing.find((row) => row.service === label) ?? null;
        return pricingCache;
      })
      .catch(() => null);
  }
  return pricingPromise;
}

export function JobBookingCard({ config }: { config: ServiceConfig }) {
  const isParcel = config.type === "PARCEL";
  const pickup = useRideBookingStore((s) => s.pickup);
  const drop = useRideBookingStore((s) => s.drop);
  const setPickup = useRideBookingStore((s) => s.setPickup);
  const setDrop = useRideBookingStore((s) => s.setDrop);
  const addresses = useAddressStore((s) => s.addresses);
  const user = useAuthStore((s) => s.user);

  const [pricing, setPricing] = useState<ServicePricing | null>(null);
  const [packageType, setPackageType] = useState("Small package");
  const [preview, setPreview] = useState<FarePreview | null>(null);
  const [checking, setChecking] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void servicePricing(config.tabLabel).then(setPricing);
  }, [config.tabLabel]);

  const checkFare = async () => {
    if (!pickup || !drop) {
      setError("Set both a pickup and drop location.");
      return;
    }
    setChecking(true);
    setError("");
    try {
      // Fare comes from the server only — distance is never guessed on-device.
      setPreview(await serviceOrderService.farePreview(config.type, pickup.address, drop.address, pickup, drop));
    } catch (e) {
      setPreview(null);
      setError(e instanceof Error ? e.message : "Could not calculate a fare.");
    } finally {
      setChecking(false);
    }
  };

  const book = async () => {
    if (!user) {
      router.push({ pathname: "/login", params: { returnTo: "/(tabs)/home" } });
      return;
    }
    if (!pickup || !drop) {
      setError("Set both a pickup and drop location.");
      return;
    }
    setBooking(true);
    setError("");
    try {
      const order = await serviceOrderService.place({
        service: config.type,
        pickup: pickup.address,
        drop: drop.address,
        packageType,
        pickupLatitude: pickup.latitude,
        pickupLongitude: pickup.longitude,
        dropLatitude: drop.latitude,
        dropLongitude: drop.longitude,
      });
      setPreview(null);
      Alert.alert("Confirmed", `${order.reference} has been booked for ₹${order.total}.`, [
        { text: "View activity", onPress: () => router.replace("/(tabs)/activity") },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not book this request.");
    } finally {
      setBooking(false);
    }
  };

  const savedPlaces = addresses.filter((a) => a.latitude != null);
  const applySaved = (field: "pickup" | "drop", a: (typeof addresses)[number]) => {
    const loc: RideLocation = { latitude: a.latitude, longitude: a.longitude, address: `${a.line1}, ${a.city}` };
    if (field === "pickup") setPickup(loc);
    else setDrop(loc);
  };

  return (
    <View style={[styles.card, { borderTopColor: config.theme.primary }]}>
      <LocationRow label="Pickup" value={pickup} onPress={() => router.push({ pathname: "/location-picker", params: { field: "pickup" } })} />
      <LocationRow label="Drop" value={drop} onPress={() => router.push({ pathname: "/location-picker", params: { field: "drop" } })} />
      {isParcel ? (
        <View style={styles.field}>
          <Text style={typography.captionStrong}>Package type</Text>
          <TextInput
            value={packageType}
            onChangeText={setPackageType}
            placeholder="e.g. Small package, Documents"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        </View>
      ) : null}

      {savedPlaces.length > 0 ? (
        <View style={styles.savedRow}>
          {savedPlaces.slice(0, 4).map((a) => (
            <Pressable
              key={a.id}
              style={styles.savedChip}
              onPress={() => applySaved(pickup ? "drop" : "pickup", a)}
              accessibilityRole="button"
            >
              <Icon name="location" size={12} color={colors.primary} />
              <Text style={styles.savedText} numberOfLines={1}>
                {a.label}: {a.line1}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {pickup && drop ? (
        <RideMapPreview pickup={pickup} drop={drop} height={180} />
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {preview && preview.distanceKm ? (
        <FareOverlay
          pickupName={pickup?.address ?? ""}
          dropName={drop?.address ?? ""}
          distanceKm={preview.distanceKm}
          baseFare={preview.baseFare}
          perKm={preview.perKm}
          platformFee={preview.platformFee}
          total={preview.total}
          onBook={() => void book()}
          booking={booking}
        />
      ) : (
        <>
          <Text style={typography.caption}>
            {pricing ? `From ₹${pricing.baseFare} • ₹${pricing.perKm}/km • Check the fare before booking.` : "Loading live pricing…"}
          </Text>
          <PrimaryButton label={checking ? "Checking…" : "Check fare"} variant="outline" onPress={() => void checkFare()} disabled={checking || !pricing || !pickup || !drop} />
          <PrimaryButton label={booking ? "Booking…" : user ? `Book ${config.tabLabel}` : "Sign in to book"} onPress={() => void book()} disabled={booking || !preview} />
        </>
      )}
    </View>
  );
}

function LocationRow({ label, value, onPress }: { label: string; value: RideLocation | null; onPress: () => void }) {
  return (
    <Pressable style={styles.locationRow} onPress={onPress} accessibilityRole="button">
      <View style={[styles.dot, label === "Drop" && styles.dotDrop]} />
      <View style={{ flex: 1 }}>
        <Text style={typography.captionStrong}>{label}</Text>
        <Text style={value ? styles.locationValue : styles.locationPlaceholder} numberOfLines={1}>
          {value ? value.address : `Tap to set ${label.toLowerCase()} location`}
        </Text>
      </View>
      <Icon name="forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 3,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    marginHorizontal: spacing.lg,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  dotDrop: { backgroundColor: colors.dark, borderRadius: 2 },
  locationValue: { ...typography.body, color: colors.text, marginTop: 2 },
  locationPlaceholder: { ...typography.body, color: colors.muted, marginTop: 2 },
  field: { gap: 6 },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.background,
  },
  savedRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  savedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    maxWidth: 180,
  },
  savedText: { ...typography.caption, fontSize: 10.5, color: colors.primary, fontWeight: "700" },
  error: { ...typography.caption, color: colors.error, fontWeight: "700" },
});