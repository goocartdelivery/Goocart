import { View, Text, StyleSheet } from "react-native";
import { Redirect, router } from "expo-router";
import { Brand } from "@/components/Brand";
import { PrimaryButton } from "@/components/PrimaryButton";
import { colors, radius, spacing, typography } from "@/theme";
import { useAuthStore } from "@/store/useAuthStore";

export default function WelcomeScreen() {
  const status = useAuthStore((s) => s.status);

  if (status === "AUTHENTICATED_VENDOR") return <Redirect href="/(tabs)/home" />;

  return (
    <View style={styles.container}>
      <Brand size={48} />
      <Text style={typography.h1}>Welcome to Goocart Vendor</Text>
      <Text style={styles.copy}>Manage your restaurant, accept orders, and track deliveries — all in one place.</Text>
      <View style={styles.btnRow}>
        <PrimaryButton label="Sign In" onPress={() => router.push("/login")} />
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
  copy: { ...typography.body, color: colors.muted, textAlign: "center", maxWidth: 300 },
  btnRow: { width: "100%", maxWidth: 300 },
});
