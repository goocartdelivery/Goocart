import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PrimaryButton } from "@/components/PrimaryButton";
import { colors, radius, spacing, typography } from "@/theme";
import { useAuthStore } from "@/store/useAuthStore";

// Reached when a valid session exists but the account is not authorized for
// the Vendor app (e.g. a customer session). The account is never promoted to
// Vendor here — the only ways forward are signing out or trying a different,
// vendor-linked account.
export default function AccessDeniedScreen() {
  const [busy, setBusy] = useState(false);
  const logout = useAuthStore((s) => s.logout);

  const signOut = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await logout();
    } finally {
      router.replace("/welcome");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed-outline" size={34} color={colors.primary} />
        </View>
        <Text style={styles.title}>You don’t have permission to access the Vendor app.</Text>
        <Text style={styles.copy}>
          This account isn’t linked to a restaurant. Sign out and sign in with the vendor account your admin set up
          for you.
        </Text>
        <PrimaryButton label={busy ? "Signing out…" : "Sign out"} onPress={() => void signOut()} disabled={busy} />
        <Pressable hitSlop={8} onPress={() => router.replace("/login")} accessibilityRole="button">
          <Text style={styles.link}>Try another account</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    padding: spacing.xl,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.lg,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { ...typography.h1, textAlign: "center" },
  copy: { ...typography.body, color: colors.muted, textAlign: "center", lineHeight: 20 },
  link: { ...typography.bodyStrong, color: colors.primary },
});