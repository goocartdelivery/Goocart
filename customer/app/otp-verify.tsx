import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Icon } from "@/components/Icon";
import { colors, radius, spacing, typography } from "@/theme";
import { useAuthStore } from "@/store/useAuthStore";

const OTP_LENGTH = 6;

// Turns "+919876543210" into a compact masked display like "+91 ••••• 3210".
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const plus = phone.startsWith("+") ? "+" : "";
  const country = digits.length > 10 ? `${digits.slice(0, digits.length - 10)} ` : "";
  const tail = digits.slice(-4);
  return `${plus}${country}••••• ${tail}`.trim();
}

export default function OtpVerifyScreen() {
  const params = useLocalSearchParams<{ phone?: string; returnTo?: string; purpose?: string; name?: string }>();
  const phone = typeof params.phone === "string" ? params.phone : "";
  const returnTo = typeof params.returnTo === "string" && params.returnTo ? params.returnTo : "/(tabs)/home";
  const name = typeof params.name === "string" ? params.name : "";

  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const requestOtp = useAuthStore((s) => s.requestOtp);

  const purpose = (typeof params.purpose === "string" ? params.purpose : "LOGIN") === "SIGNUP" ? "SIGNUP" : "LOGIN";

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const refs = useRef<Array<TextInput | null>>([]);

  const code = digits.join("");
  const isComplete = code.length === OTP_LENGTH;

  // Cooldown countdown timer — mirrors the existing login screen behaviour.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => (prev <= 1 ? 0 : prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus the first box shortly after mount so the keyboard is ready.
  useEffect(() => {
    const handle = setTimeout(() => refs.current[0]?.focus(), 150);
    return () => clearTimeout(handle);
  }, []);

  const goBackToPhone = () => {
    router.back();
  };

  const changeNumber = () => {
    router.back();
  };

  const focusIndex = (index: number) => {
    const next = Math.min(Math.max(index, 0), OTP_LENGTH - 1);
    refs.current[next]?.focus();
  };

  const handleDigit = (index: number, value: string) => {
    const numeric = value.replace(/\D/g, "");
    setError("");
    if (numeric.length === 0) {
      setDigits((d) => {
        const next = [...d];
        next[index] = "";
        return next;
      });
      return;
    }
    // Support pasting a full 6-digit code into any box.
    if (numeric.length > 1) {
      const chars = numeric.slice(0, OTP_LENGTH).split("");
      setDigits((d) => {
        const next = [...d];
        chars.forEach((c, i) => {
          if (index + i < OTP_LENGTH) next[index + i] = c;
        });
        return next;
      });
      focusIndex(Math.min(index + chars.length, OTP_LENGTH - 1));
      return;
    }
    setDigits((d) => {
      const next = [...d];
      next[index] = numeric;
      return next;
    });
    // Auto-advance only when moving forward is possible.
    if (index < OTP_LENGTH - 1) focusIndex(index + 1);
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && digits[index] === "") {
      if (index > 0) focusIndex(index - 1);
    }
  };

  const handleVerify = async () => {
    if (!isComplete || busy) return;
    setError("");
    setBusy(true);
    try {
      await verifyOtp(phone, purpose, code, purpose === "SIGNUP" ? name : undefined);
      router.replace(returnTo as Href);
    } catch (e: any) {
      if (e?.message === "NEW_USER") {
        // Firebase verified the phone but no Goocart account exists —
        // navigate to profile completion.
        router.replace({
          pathname: "/complete-profile",
          params: { returnTo, name: name || "" },
        } as any);
        return;
      }
      setError(e?.message ?? "Incorrect code. Please try again.");
      setBusy(false);
      setDigits(Array(OTP_LENGTH).fill(""));
      focusIndex(0);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || busy) return;
    setError("");
    setBusy(true);
    try {
      await requestOtp(phone, purpose);
      setCooldown(60);
    } catch (e: any) {
      setError(e?.message ?? "Couldn't resend the code. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
        {/* Top row: back button (left) — falls back to leaving the screen */}
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={goBackToPhone} style={styles.backBtn}>
            <Icon name="back" size={20} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.hero}>
            <Text style={typography.h1}>Verify your phone number</Text>
            <Text style={styles.subtitle}>We’ve sent a 6-digit verification code to</Text>
            <Text style={styles.phone}>{maskPhone(phone) || "your number"}</Text>
            <Pressable onPress={changeNumber} hitSlop={8} accessibilityRole="button">
              <Text style={styles.change}>Change number</Text>
            </Pressable>
          </View>

          <View style={styles.otpRow}>
            {digits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el) => {
                    refs.current[index] = el;
                  }}
                  style={[
                    styles.otpBox,
                    focusedIndex === index && digit === "" && styles.otpBoxFocused,
                    digit !== "" && styles.otpBoxFilled,
                    error !== "" && styles.otpBoxError,
                  ]}
                  value={digit}
                  onChangeText={(v) => handleDigit(index, v)}
                  onKeyPress={(e) => handleKeyPress(index, e.nativeEvent.key)}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex((current) => (current === index ? -1 : current))}
                  keyboardType="number-pad"
                  maxLength={6}
                  selectTextOnFocus
                  placeholder=""
                />
              ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : <View style={styles.errorSpacer} />}

          <View style={styles.actions}>
            <PrimaryButton label={busy ? "Verifying…" : "Verify & Continue"} onPress={() => void handleVerify()} disabled={!isComplete || busy} loading={busy} />

            <View style={styles.resendRow}>
              <Text style={styles.resendPrompt}>Didn’t receive the code?  </Text>
              <Pressable onPress={() => void handleResend()} disabled={cooldown > 0 || busy} hitSlop={8}>
                <Text style={[styles.resendAction, cooldown > 0 && styles.resendMuted]}>
                  {cooldown > 0 ? `Resend OTP in 00:${String(cooldown).padStart(2, "0")}` : "Resend OTP"}
                </Text>
              </Pressable>
            </View>
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
  backBtn: { width: 40, height: 40, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xxxl, gap: spacing.xl },
  hero: { gap: spacing.xs, alignItems: "flex-start" },
  subtitle: { ...typography.body, color: colors.muted, marginTop: spacing.xs },
  phone: { ...typography.bodyStrong, color: colors.text, fontSize: 16, marginTop: spacing.xs },
  change: { ...typography.captionStrong, color: colors.primary, marginTop: spacing.lg },

  otpRow: { flexDirection: "row", gap: spacing.sm },
  otpBox: {
    flex: 1,
    maxWidth: 56,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    paddingVertical: 0,
  },
  otpBoxFilled: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  otpBoxFocused: { borderColor: colors.primary, borderWidth: 2 },
  otpBoxError: { borderColor: colors.error, backgroundColor: colors.errorMuted },

  error: { ...typography.caption, color: colors.error, textAlign: "center", marginTop: spacing.sm },
  errorSpacer: { height: typography.caption.fontSize! + spacing.sm },

  actions: { gap: spacing.lg, marginTop: spacing.md },
  resendRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", flexWrap: "wrap" },
  resendPrompt: { ...typography.caption, color: colors.muted },
  resendAction: { ...typography.captionStrong, color: colors.primary },
  resendMuted: { color: colors.muted },
});