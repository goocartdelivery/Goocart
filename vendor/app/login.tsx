import { useState } from "react";
import { ActivityIndicator, Image as RNImage, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PublicGate } from "@/components/AuthGates";
import { ApiError } from "@/services/apiClient";
import { useAuthStore, WrongRoleError } from "@/store/useAuthStore";
import { colors, radius, spacing, typography } from "@/theme";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9]{7,15}$/;
const IDENTIFIER_RE = /^[a-zA-Z0-9_.@+-]+$/;

const LOGO_ASPECT_RATIO = 960 / 161;
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remembered, setRemembered] = useState(false);
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const signIn = useAuthStore((s) => s.signIn);

  const submit = async () => {
    setError("");
    const id = identifier.trim();
    let hasError = false;

    if (!id) {
      setIdentifierError("Enter your email or phone.");
      hasError = true;
    } else if (!IDENTIFIER_RE.test(id) || (!EMAIL_RE.test(id) && !PHONE_RE.test(id.replace(/[\s-]/g, "")))) {
      setIdentifierError("Enter a valid email address or phone number.");
      hasError = true;
    }
    if (!password) {
      setPasswordError("Enter your password.");
      hasError = true;
    }
    if (hasError) return;

    setBusy(true);
    try {
      await signIn(id, password);
      router.replace("/(tabs)/home");
    } catch (e) {
      if (e instanceof WrongRoleError) {
        setError(e.message);
      } else if (e instanceof ApiError && e.status === 0) {
        setError("Unable to connect to Goocart. Please check your internet connection and try again.");
      } else {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <PublicGate>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
          <ScrollView
            contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
            keyboardShouldPersistTaps="handled"
          >
            {/* Brand */}
            <View style={styles.brandRow}>
              <RNImage
                source={require("../assets/images/logo-full.png")}
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="Goocart"
              />
              <Text style={styles.vendorLabel}>VENDOR</Text>
            </View>

            {/* Welcome */}
            <View style={styles.hero}>
              <Text style={typography.h1}>Welcome Back!</Text>
              <Text style={styles.subtitle}>Login to manage your restaurant</Text>
            </View>

            {/* Form */}
            {error ? <Text style={styles.bannerError}>{error}</Text> : null}

            <InputField
              icon="person-outline"
              placeholder="Email or Phone"
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

            <InputField
              icon="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (passwordError) setPasswordError("");
              }}
              error={passwordError}
              secureTextEntry
              textContentType="password"
            />

            <View style={styles.rememberRow}>
              <Pressable
                onPress={() => setRemembered((v) => !v)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: remembered }}
                accessibilityLabel="Remember me"
                style={styles.checkboxRow}
              >
                <View style={[styles.checkbox, remembered && styles.checkboxChecked]}>
                  {remembered ? <Ionicons name="checkmark" size={12} color={colors.white} /> : null}
                </View>
                <Text style={styles.rememberLabel}>Remember me</Text>
              </Pressable>

              <Pressable hitSlop={8} onPress={() => router.push("/forgot-password")} accessibilityRole="button">
                <Text style={styles.forgot}>Forgot password?</Text>
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Contact Support"
              onPress={() => {}}
              style={styles.supportRow}
            >
              <Text style={styles.supportText}>
                Don’t have an account?{" "}
                <Text style={styles.supportLink}>Contact Support</Text>
              </Text>
            </Pressable>

            <View style={styles.buttonSpacer} />

            <View style={styles.buttonWrap}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: busy }}
                onPress={() => void submit()}
                disabled={busy}
                style={[styles.button, busy && styles.buttonDisabled]}
              >
                {busy ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.buttonText}>Login</Text>}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PublicGate>
  );
}

function InputField({
  icon,
  placeholder,
  secureTextEntry,
  error,
  value,
  onChangeText,
  ...props
}: {
  icon: "person-outline" | "lock-closed-outline";
  placeholder: string;
  secureTextEntry?: boolean;
  error?: string;
  value: string;
  onChangeText: (text: string) => void;
} & React.ComponentProps<typeof TextInput>) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.field}>
      <View style={[styles.inputWrap, error ? styles.inputWrapError : null]}>
        <Ionicons name={icon} size={18} color={colors.muted} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, secureTextEntry ? styles.inputWithIcon : null]}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          autoCorrect={false}
          secureTextEntry={secureTextEntry && !visible}
          value={value}
          onChangeText={onChangeText}
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
            <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    maxWidth: 430,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  brandRow: { alignItems: "center", gap: spacing.sm },
  logo: { height: 44, width: 44 * LOGO_ASPECT_RATIO },
  vendorLabel: { ...typography.captionStrong, color: colors.muted, letterSpacing: 3, marginTop: spacing.xs },
  hero: { gap: spacing.xs },
  subtitle: { ...typography.body, color: colors.muted },
  field: { gap: 6 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    height: 52,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  inputWrapError: { borderColor: colors.error },
  inputIcon: { width: 20, alignItems: "center" },
  input: { flex: 1, ...typography.body },
  inputWithIcon: { paddingRight: 40 },
  visibilityToggle: { paddingLeft: 4 },
  fieldError: { ...typography.caption, color: colors.error },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  rememberLabel: { ...typography.body, color: colors.text },
  forgot: { ...typography.bodyStrong, color: colors.primary },
  supportRow: { alignItems: "center" },
  supportText: { ...typography.caption, color: colors.muted, textAlign: "center" },
  supportLink: { color: colors.primary },
  buttonSpacer: { flex: 1 },
  buttonWrap: { width: "100%" },
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { ...typography.button, color: colors.white },
  bannerError: { ...typography.caption, color: colors.error, textAlign: "center" },
});
