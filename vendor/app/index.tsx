import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { Brand } from "@/components/Brand";
import { PrimaryButton } from "@/components/PrimaryButton";
import { colors, radius, spacing, typography } from "@/theme";
import { useAuthStore } from "@/store/useAuthStore";

const MIN_SPLASH_MS = 700;

export default function Splash() {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const status = useAuthStore((s) => s.status);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  const ready = hasHydrated && minTimeElapsed;

  if (ready) {
    if (status === "AUTHENTICATED_VENDOR") return <Redirect href="/(tabs)/home" />;
    if (status === "AUTHENTICATED_NON_VENDOR") return <Redirect href="/access-denied" />;
    if (status === "NOT_AUTHENTICATED") return <Redirect href="/welcome" />;
    if (status === "AUTH_ERROR") return <ConnectionError />;
    // AUTH_CHECKING can end here on a very fast retry; render the spinner.
  }

  return (
    <View style={styles.container}>
      <Brand size={44} />
      <Text style={styles.tagline}>Checking your session…</Text>
    </View>
  );
}

function ConnectionError() {
  const hydrate = useAuthStore((s) => s.hydrate);
  return (
    <View style={styles.container}>
      <Brand size={40} />
      <View style={styles.panel}>
        <Text style={typography.h2}>Can’t reach Goocart right now</Text>
        <Text style={styles.copy}>Unable to connect to Goocart. Please check your internet connection and try again.</Text>
        <PrimaryButton label="Retry" onPress={() => void hydrate()} />
        <Pressable onPress={() => useAuthStore.setState({ status: "NOT_AUTHENTICATED" })} hitSlop={8}>
          <Text style={styles.link}>Sign in instead</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.lg,
  },
  tagline: { ...typography.body, color: colors.muted, textAlign: "center" },
  panel: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: "center",
  },
  copy: { ...typography.body, color: colors.muted, textAlign: "center" },
  link: { ...typography.bodyStrong, color: colors.primary },
});