import { useEffect, useMemo, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { Brand } from "@/components/Brand";
import { LocationStatusBar } from "@/components/LocationStatusBar";
import { colors, spacing, typography } from "@/theme";
import { useAuthStore } from "@/store/useAuthStore";
import { useLocationStore } from "@/store/useLocationStore";

const MIN_SPLASH_MS = 1100;

export default function Splash() {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const opacity = useMemo(() => new Animated.Value(0), []);

  const authHydrated = useAuthStore((s) => s.hasHydrated);
  const user = useAuthStore((s) => s.user);
  const locationHydrated = useLocationStore((s) => s.hasHydrated);
  const hasCachedLocation = useLocationStore((s) => s.hasCachedLocation);
  const locationStatus = useLocationStore((s) => s.status);

  useEffect(() => {
    // Hydration itself is kicked off once from the root layout so it covers
    // every entry route, not just this splash screen.
    Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, [opacity]);

  // First run: auto-detect the location right here on the logo splash,
  // Swiggy-style — non-blocking, and respects a prior permission decline
  // (never re-prompts on its own).
  useEffect(() => {
    if (!authHydrated || !locationHydrated || hasCachedLocation) return;
    const state = useLocationStore.getState();
    if (!state.selected && state.status === "idle") void state.detectCurrentLocation();
  }, [authHydrated, locationHydrated, hasCachedLocation]);

  const ready = authHydrated && locationHydrated && minTimeElapsed;

  if (ready) {
    if (user) return <Redirect href="/(tabs)/home" />;
    // Returning guest with a cached location browses straight to home.
    if (hasCachedLocation) return <Redirect href="/(tabs)/home" />;
    // First-run guest: let the location detection settle on this screen,
    // then move onto sign-in. If detection failed/unavailable, the pill shows
    // why and the Continue button below still lets them in.
    if (locationStatus === "detected") return <Redirect href="/login" />;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.center, { opacity }]}>
        <Brand size={48} />
        <Text style={styles.tagline}>Everything around you.{"\n"}One Go.</Text>

        <View style={styles.statusWrap}>
          <LocationStatusBar />
        </View>

        <Pressable style={styles.continue} onPress={() => router.replace("/login")} hitSlop={8}>
          <Text style={styles.continueText}>Continue</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  center: { alignItems: "center", gap: spacing.lg },
  tagline: { ...typography.body, color: colors.muted, textAlign: "center", marginTop: spacing.sm },
  statusWrap: { width: "100%", maxWidth: 300 },
  continue: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  continueText: { fontSize: 12, fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.6 },
});