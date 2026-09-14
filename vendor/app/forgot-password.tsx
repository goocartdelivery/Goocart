import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "@/components/ScreenHeader";
import { PrimaryButton } from "@/components/PrimaryButton";
import { PublicGate } from "@/components/AuthGates";
import { ApiError, apiPost } from "@/services/apiClient";
import { useAuthStore, WrongRoleError, type AuthSession } from "@/store/useAuthStore";
import { colors, radius, spacing, typography } from "@/theme";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9]{7,15}$/;
const IDENTIFIER_RE = /^[a-zA-Z0-9_.@+-]+$/;

// Reuses the backend's existing password-reset OTP endpoints — no new or
// alternate authentication system is introduced.
export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<"request" | "confirm">("request");

  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [identifierError, setIdentifierError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const applyAuth = useAuthStore((s) => s.applyAuth);

  const requestReset = async () => {
    setError("");
    setInfo("");
    const id = identifier.trim();
    if (!id) return setIdentifierError("Enter your email or phone.");
    if (!IDENTIFIER_RE.test(id) || (!EMAIL_RE.test(id) && !PHONE_RE.test(id.replace(/[\s-]/g, "")))) {
      return setIdentifierError("Enter a valid email address or phone number.");
    }
    setBusy(true);
    try {
      const res = await apiPost<{ identifier: string }>("/api/v1/auth/password/reset-request", { identifier: id });
      setInfo(res.identifier ? "If that account exists, a reset code has been sent." : "If that account exists, a reset code has been sent.");
      setStep("confirm");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not request a reset code.");
    } finally {
      setBusy(false);
    }
  };

  const confirmReset = async () => {
    setError("");
    let hasError = false;
    if (!/^[0-9]{6}$/.test(code.trim())) {
      setCodeError("Enter the 6-digit code from the email.");
      hasError = true;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      hasError = true;
    }
    if (hasError) return;

    setBusy(true);
    try {
      const session = await apiPost<AuthSession>("/api/v1/auth/password/reset-confirm", {
        identifier: identifier.trim(),
        code: code.trim(),
        newPassword,
      });
      await applyAuth(session);
      router.replace("/(tabs)/home");
    } catch (e) {
      if (e instanceof WrongRoleError) {
        setError(e.message);
      } else if (e instanceof ApiError && e.status === 0) {
        setError("Unable to connect to Goocart. Please check your internet connection and try again.");
      } else {
        setError(e instanceof Error ? e.message : "Could not reset your password.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <PublicGate>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ScreenHeader title="Reset password" />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {step === "request" ? (
              <>
                <Text style={typography.h1}>Forgot your password?</Text>
                <Text style={styles.copy}>
                  Enter the email or phone on your account and we’ll send you a code to reset it.
                </Text>
                <Field
                  label="Email / Phone"
                  value={identifier}
                  onChangeText={(value) => {
                    setIdentifier(value);
                    if (identifierError) setIdentifierError("");
                  }}
                  error={identifierError}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="username"
                />
                {info ? <Text style={styles.info}>{info}</Text> : null}
                {error ? <Text style={styles.bannerError}>{error}</Text> : null}
                <PrimaryButton label={busy ? "Sending…" : "Send reset code"} onPress={() => void requestReset()} disabled={busy} />
              </>
            ) : (
              <>
                <Text style={typography.h1}>Enter the reset code</Text>
                <Text style={styles.copy}>We sent a 6-digit code to {identifier.trim()}.</Text>

                <Field
                  label="Code"
                  value={code}
                  onChangeText={(value) => {
                    setCode(value.replace(/[^0-9]/g, ""));
                    if (codeError) setCodeError("");
                  }}
                  error={codeError}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  maxLength={6}
                />
                <Field
                  label="New password"
                  value={newPassword}
                  onChangeText={(value) => {
                    setNewPassword(value);
                    if (passwordError) setPasswordError("");
                  }}
                  error={passwordError}
                  secureTextEntry
                  textContentType="newPassword"
                />
                {error ? <Text style={styles.bannerError}>{error}</Text> : null}
                <PrimaryButton label={busy ? "Resetting…" : "Reset password"} onPress={() => void confirmReset()} disabled={busy} />

                <Pressable hitSlop={8} onPress={() => { setStep("request"); setError(""); }} accessibilityRole="button">
                  <Text style={styles.link}>Change email or phone</Text>
                </Pressable>
              </>
            )}

            <Pressable hitSlop={8} onPress={() => router.back()} accessibilityRole="button">
              <Text style={styles.link}>Back to sign in</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PublicGate>
  );
}

function Field({
  label,
  secureTextEntry,
  error,
  ...props
}: { label: string; secureTextEntry?: boolean; error?: string } & React.ComponentProps<typeof TextInput>) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={typography.captionStrong}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, secureTextEntry ? styles.inputWithIcon : null, error ? styles.inputError : null]}
          placeholderTextColor={colors.muted}
          autoCorrect={false}
          secureTextEntry={secureTextEntry && !visible}
          {...props}
        />
        {secureTextEntry ? (
          <Pressable
            style={styles.visibilityToggle}
            hitSlop={8}
            onPress={() => setVisible((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={visible ? "Hide password" : "Show password"}
          >
            <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.md, maxWidth: 430, width: "100%", alignSelf: "center" },
  copy: { ...typography.body, color: colors.muted, marginBottom: spacing.sm },
  field: { gap: 6 },
  inputWrap: { justifyContent: "center" },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    ...typography.body,
  },
  inputError: { borderColor: colors.error },
  inputWithIcon: { paddingRight: 44 },
  visibilityToggle: { position: "absolute", right: 0, height: 50, width: 44, alignItems: "center", justifyContent: "center" },
  fieldError: { ...typography.caption, color: colors.error },
  info: { ...typography.caption, color: colors.success },
  bannerError: { ...typography.caption, color: colors.error, textAlign: "center" },
  link: { ...typography.bodyStrong, color: colors.primary, textAlign: "center" },
});