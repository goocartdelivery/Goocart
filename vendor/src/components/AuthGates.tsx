import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { colors, spacing, typography } from "@/theme";
import { useAuthStore } from "@/store/useAuthStore";

function LoadingGate() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.copy}>Checking your session…</Text>
    </View>
  );
}

/**
 * Protects Vendor-only screens. Renders children only for
 * AUTHENTICATED_VENDOR; every other state either waits for the session check
 * or bounces to the right place (auth flow, retry splash, or access denied).
 * Backend authorization remains the real gate — this only controls what is
 * visible/rendered in the app shell.
 */
export function RequireVendor({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  if (status === "AUTHENTICATED_VENDOR") return <>{children}</>;
  if (status === "AUTH_CHECKING") return <LoadingGate />;
  if (status === "AUTHENTICATED_NON_VENDOR") return <Redirect href="/access-denied" />;
  if (status === "AUTH_ERROR") return <Redirect href="/" />;
  // NOT_AUTHENTICATED (and any future state) falls into the auth flow.
  return <Redirect href="/welcome" />;
}

/**
 * Keeps the auth entry screens (welcome / login / forgot password) honest:
 * an already-authorized vendor is bounced straight to the dashboard, a valid
 * non-vendor session goes to access denied, and while the session check is
 * still running nothing is shown yet (no login flash).
 */
export function PublicGate({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  if (status === "AUTHENTICATED_VENDOR") return <Redirect href="/(tabs)/home" />;
  if (status === "AUTHENTICATED_NON_VENDOR") return <Redirect href="/access-denied" />;
  if (status === "AUTH_CHECKING") return <LoadingGate />;
  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, backgroundColor: colors.background },
  copy: { ...typography.caption, color: colors.muted },
});