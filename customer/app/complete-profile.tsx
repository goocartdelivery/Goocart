import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Icon } from "@/components/Icon";
import { colors, radius, spacing, typography } from "@/theme";
import { useAuthStore } from "@/store/useAuthStore";
import { ApiError } from "@/services/apiClient";

export default function CompleteProfileScreen() {
  const params = useLocalSearchParams<{ returnTo?: string; name?: string }>();
  const returnTo = typeof params.returnTo === "string" && params.returnTo ? params.returnTo : "/(tabs)/home";

  const [name, setName] = useState(typeof params.name === "string" ? params.name : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const registerFirebaseUser = useAuthStore((s) => s.registerFirebaseUser);

  const handleSubmit = async () => {
    setError("");
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Enter your full name.");
      return;
    }
    setBusy(true);
    try {
      await registerFirebaseUser(trimmed);
      router.replace(returnTo as Href);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backBtn}>
            <Icon name="back" size={20} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.hero}>
            <Text style={typography.h1}>Complete your profile</Text>
            <Text style={styles.subtitle}>Enter your name to finish setting up your account</Text>
          </View>

          <View style={styles.field}>
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => void handleSubmit()}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : <View style={styles.errorSpacer} />}

          <View style={styles.actions}>
            <PrimaryButton label={busy ? "Creating account…" : "Create Account"} onPress={() => void handleSubmit()} disabled={busy} loading={busy} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, flexDirection: "row" },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xxxl, gap: spacing.xl },
  hero: { gap: spacing.xs, alignItems: "flex-start" },
  subtitle: { ...typography.body, color: colors.muted, marginTop: spacing.xs },
  field: { width: "100%" },
  input: {
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  error: { ...typography.caption, color: colors.error, textAlign: "center", marginTop: spacing.sm },
  errorSpacer: { height: (typography.caption.fontSize ?? 12) + spacing.sm },
  actions: { gap: spacing.lg, marginTop: spacing.md },
});
