import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Brand } from "@/components/Brand";
import { PrimaryButton } from "@/components/PrimaryButton";
import { colors, radius, spacing, typography } from "@/theme";
import { useAuthStore } from "@/store/useAuthStore";

export default function AccessDeniedScreen() {
  return (
    <View style={styles.container}>
      <Brand size={40} />
      <View style={styles.panel}>
        <Text style={typography.h2}>Access Denied</Text>
        <Text style={styles.copy}>This account doesn't have vendor access. Please sign in with a vendor account.</Text>
        <PrimaryButton label="Sign In with Different Account" onPress={() => { useAuthStore.setState({ status: "NOT_AUTHENTICATED" }); router.replace("/login"); }} />
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
});
