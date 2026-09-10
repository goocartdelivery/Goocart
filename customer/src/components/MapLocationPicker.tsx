import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Circle, Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { Icon } from "@/components/Icon";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ensureForegroundPermission, locationService } from "@/services/LocationService";
import { reverseGeocodeDetailed } from "@/services/PlacesService";
import { colors, radius, spacing, typography } from "@/theme";

// The exact delivery location the customer confirms — the coordinates are the
// authoritative data (delivery assignment and tracking use lat/lng), and the
// text fields mirror the project's address schema (house/building are not
// derivable from a geocoder and stay empty for the user to fill in).
export type PickedLocation = {
  latitude: number;
  longitude: number;
  street: string;
  city: string;
  state: string;
  pincode: string;
  address: string;
};

type Props = {
  // Where the map should start. Null lets the component use the customer's
  // current location (permission permitting) and then fall back to the app's
  // standard default viewport.
  initialLocation?: { latitude: number; longitude: number } | null;
  confirmLabel?: string;
  onConfirm: (location: PickedLocation) => void;
};

const DEFAULT_DELTA = 0.01;
// Default viewport so the map has somewhere sensible to start — the same
// fallback the ride-booking picker uses. The confirmed location is always the
// settled pin/center, never this preset.
const FALLBACK_LATITUDE = 17.4362;
const FALLBACK_LONGITUDE = 81.2661;
// Reverse geocoding only runs once the map has settled and the settle timer
// has elapsed — never per tiny drag frame.
const RESOLVE_SETTLE_MS = 400;

const GEOCODE_FAILED_MESSAGE = "We couldn't determine the address. You can still confirm this location and edit the details.";

function coordsAddress(latitude: number, longitude: number): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

function formatAddress(street: string, city: string, state: string, pincode: string): string {
  const parts = [street, city, state, pincode].map((p) => p?.trim()).filter(Boolean);
  const seen = new Set<string>();
  const unique = parts.filter((part) => {
    const key = part.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return unique.join(", ") || "";
}

function PulsingDot({ coordinates }: { coordinates: { latitude: number; longitude: number } }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseAnim]);

  return (
    <Marker coordinate={coordinates} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
      <View style={styles.pulseOuter}>
        <Animated.View style={[styles.pulseRing, { opacity: pulseAnim, transform: [{ scale: pulseAnim }] }]} />
        <View style={styles.pulseInner} />
      </View>
    </Marker>
  );
}

export function MapLocationPicker({ initialLocation, confirmLabel = "Confirm location", onConfirm }: Props) {
  const mapRef = useRef<MapView>(null);
  const mountedRef = useRef(true);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Monotonic id for every resolve attempt — a stale reverse-geocoding
  // response can never overwrite a newer pin because its id no longer
  // matches the latest one.
  const requestSeq = useRef(0);

  const [region, setRegion] = useState<Region | null>(null);
  const [resolved, setResolved] = useState<PickedLocation | null>(null);
  const [resolving, setResolving] = useState(true);
  const [locating, setLocating] = useState(false);
  const [autoLocating, setAutoLocating] = useState(true);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const resolveAt = async (lat: number, lng: number, seq: number) => {
    if (!mountedRef.current || seq !== requestSeq.current) return;
    setResolving(true);
    setError("");
    const geo = await reverseGeocodeDetailed(lat, lng);
    if (!mountedRef.current || seq !== requestSeq.current) return;
    setResolving(false);
    if (geo) {
      const address = formatAddress(geo.street, geo.city, geo.state, geo.pincode);
      setResolved({ latitude: lat, longitude: lng, ...geo, address });
      return;
    }
    // Reverse geocoding had no row for this location (offline, sparse native
    // geocoder, or genuinely unmapped coords). Coordinates are preserved and
    // the user is told the address could not be filled — nothing is
    // fabricated, and confirming still carries the exact lat/lng to edit.
    setResolved({ latitude: lat, longitude: lng, street: "", city: "", state: "", pincode: "", address: coordsAddress(lat, lng) });
    setError(GEOCODE_FAILED_MESSAGE);
  };

  // Debounced + stale-guarded: each map settle schedules one geocode; a newer
  // settle invalidates the previous one.
  const onRegionChangeComplete = (next: Region) => {
    setRegion(next);
    const seq = ++requestSeq.current;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    setResolving(true);
    settleTimer.current = setTimeout(() => {
      void resolveAt(next.latitude, next.longitude, seq);
    }, RESOLVE_SETTLE_MS);
  };

  useEffect(() => {
    mountedRef.current = true;
    const initial = initialLocation ? { latitude: initialLocation.latitude, longitude: initialLocation.longitude } : null;

    void (async () => {
      let start: { latitude: number; longitude: number };
      if (initial) {
        start = initial;
        setAutoLocating(false);
      } else {
        setAutoLocating(true);
        setLocating(true);
        const permission = await ensureForegroundPermission();
        if (!mountedRef.current) return;
        if (permission === "granted") {
          const fix = await locationService.getCoordinates();
          if (!mountedRef.current) return;
          if (fix.state === "success") {
            start = { latitude: fix.latitude, longitude: fix.longitude };
            setUserLocation(start);
          } else {
            setError("Couldn't get a GPS fix. You can still move the pin to your location.");
            start = { latitude: FALLBACK_LATITUDE, longitude: FALLBACK_LONGITUDE };
          }
        } else {
          if (permission === "permanently-denied") {
            setError("Location access is blocked. Enable it in Settings to auto-detect your position.");
          }
          start = { latitude: FALLBACK_LATITUDE, longitude: FALLBACK_LONGITUDE };
        }
        if (mountedRef.current) setLocating(false);
        setAutoLocating(false);
      }
      const startRegion = { ...start, latitudeDelta: DEFAULT_DELTA, longitudeDelta: DEFAULT_DELTA };
      if (!mountedRef.current) return;
      setRegion(startRegion);
      await resolveAt(start.latitude, start.longitude, ++requestSeq.current);
    })();

    return () => {
      mountedRef.current = false;
      if (settleTimer.current) clearTimeout(settleTimer.current);
      requestSeq.current += 1;
    };
    // Run once on mount; the map's own pan/confirm interactions own state
    // after this (same convention as location-picker.tsx).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locateCurrentPosition = async () => {
    setError("");
    setLocating(true);
    try {
      const permission = await ensureForegroundPermission();
      if (permission !== "granted") {
        if (mountedRef.current) {
          setError(
            permission === "permanently-denied"
              ? "Location access is blocked on this device. Enable it in Settings, then try again."
              : "Location permission is required to detect your location.",
          );
        }
        return;
      }
      const fix = await locationService.getCoordinates();
      if (!mountedRef.current) return;
      if (fix.state !== "success") {
        setError("Couldn't get a GPS fix for your location. Check that location services are on, then try again.");
        return;
      }
      const coords = { latitude: fix.latitude, longitude: fix.longitude };
      setUserLocation(coords);
      const next = { ...coords, latitudeDelta: DEFAULT_DELTA, longitudeDelta: DEFAULT_DELTA };
      mapRef.current?.animateToRegion(next, 400);
      // animateToRegion fires onRegionChangeComplete, but a manual call keeps
      // the pin correct even if the native callback is missed on some
      // platforms/animations.
      onRegionChangeComplete(next);
    } finally {
      if (mountedRef.current) setLocating(false);
    }
  };

  const retryAutoLocate = () => {
    setError("");
    setAutoLocating(true);
    setLocating(true);
    setUserLocation(null);
    setRegion(null);
    setResolved(null);
    setResolving(true);
    void (async () => {
      try {
        const permission = await ensureForegroundPermission();
        if (!mountedRef.current) return;
        if (permission === "granted") {
          const fix = await locationService.getCoordinates();
          if (!mountedRef.current) return;
          if (fix.state === "success") {
            const coords = { latitude: fix.latitude, longitude: fix.longitude };
            setUserLocation(coords);
            const startRegion = { ...coords, latitudeDelta: DEFAULT_DELTA, longitudeDelta: DEFAULT_DELTA };
            setRegion(startRegion);
            await resolveAt(coords.latitude, coords.longitude, ++requestSeq.current);
          } else {
            setError("Still couldn't get a GPS fix. Try moving to an area with better signal.");
            const fallbackRegion = { latitude: FALLBACK_LATITUDE, longitude: FALLBACK_LONGITUDE, latitudeDelta: DEFAULT_DELTA, longitudeDelta: DEFAULT_DELTA };
            setRegion(fallbackRegion);
            await resolveAt(FALLBACK_LATITUDE, FALLBACK_LONGITUDE, ++requestSeq.current);
          }
        } else {
          setError("Location permission is needed to auto-detect your position.");
          const fallbackRegion = { latitude: FALLBACK_LATITUDE, longitude: FALLBACK_LONGITUDE, latitudeDelta: DEFAULT_DELTA, longitudeDelta: DEFAULT_DELTA };
          setRegion(fallbackRegion);
          await resolveAt(FALLBACK_LATITUDE, FALLBACK_LONGITUDE, ++requestSeq.current);
        }
      } finally {
        if (mountedRef.current) {
          setAutoLocating(false);
          setLocating(false);
        }
      }
    })();
  };

  const canConfirm = Boolean(resolved && region && !resolving && !locating);

  const confirm = () => {
    if (!resolved || !canConfirm) return;
    onConfirm(resolved);
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        {region ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
            initialRegion={region}
            onRegionChangeComplete={onRegionChangeComplete}
            showsUserLocation={false}
          >
            {userLocation ? <PulsingDot coordinates={userLocation} /> : null}
            {userLocation ? (
              <Circle
                center={userLocation}
                radius={40}
                strokeColor="rgba(66, 133, 244, 0.25)"
                fillColor="rgba(66, 133, 244, 0.08)"
                strokeWidth={1}
              />
            ) : null}
          </MapView>
        ) : (
          <View style={styles.mapLoading}>
            <View style={styles.loadingContent}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.loadingText}>Finding your location…</Text>
            </View>
          </View>
        )}

        {/* Auto-locate loading overlay — shown while GPS is being acquired on mount */}
        {autoLocating ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <View style={styles.loadingCard}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={styles.loadingOverlayText}>Finding your location…</Text>
            </View>
          </View>
        ) : null}

        {/* Fixed delivery pin — the map moves under it; the pin tip marks the
            exact center coordinate that gets confirmed. */}
        {region ? (
          <View style={styles.pinWrap} pointerEvents="none">
            <Icon name="location" size={36} color={colors.primary} />
          </View>
        ) : null}

        <Pressable style={styles.currentLocationBtn} onPress={() => void locateCurrentPosition()} disabled={locating} accessibilityLabel="Use current location">
          {locating ? <ActivityIndicator size="small" color={colors.primary} /> : <Icon name="location" size={20} color={colors.primary} />}
        </Pressable>
      </View>

      <View style={styles.footer}>
        <View style={styles.addressRow}>
          <Icon name="location" size={16} color={colors.primary} />
          <Text style={styles.addressText} numberOfLines={2}>
            {resolving ? "📍 Detecting this location…" : resolved?.address ?? "Move the map to choose a location"}
          </Text>
        </View>
        {error ? (
          <View style={styles.errorRow}>
            <Text style={styles.error}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={retryAutoLocate}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}
        <PrimaryButton label={confirmLabel} onPress={confirm} disabled={!canConfirm} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapWrap: { flex: 1 },
  map: { flex: 1 },
  mapLoading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  loadingContent: { alignItems: "center", gap: spacing.md },
  loadingText: { ...typography.body, color: colors.muted },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.6)" },
  loadingCard: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.lg, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  loadingOverlayText: { ...typography.bodyStrong, color: colors.text },
  // Offset upward by half the icon height so the pin's visual tip — not its
  // center — lands on the true center of the map.
  pinWrap: { position: "absolute", top: "50%", left: "50%", marginLeft: -18, marginTop: -36 },
  pulseOuter: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  pulseRing: { position: "absolute", width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(66, 133, 244, 0.25)" },
  pulseInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#4285F4", borderWidth: 2, borderColor: "#FFFFFF" },
  currentLocationBtn: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  footer: { padding: spacing.lg, gap: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  addressRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  addressText: { ...typography.bodyStrong, flex: 1 },
  errorRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  error: { ...typography.caption, color: colors.error, flex: 1 },
  retryBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.sm, backgroundColor: colors.primaryMuted },
  retryText: { ...typography.captionStrong, color: colors.primary },
});
