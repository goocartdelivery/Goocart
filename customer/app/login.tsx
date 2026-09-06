import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image as RNImage,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/useAuthStore";
import { ApiError } from "@/services/apiClient";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const logoFull = require("../assets/images/logo-full.png");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const heroImage = require("../assets/images/login_hero_image.webp");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9]{7,15}$/;
const USERNAME_RE = /^[a-zA-Z0-9_.]{3,30}$/;

const BRAND_ORANGE = "#F4512A";
const BRAND_ORANGE_LIGHT = "#FFF1EC";
const DARK_TEXT = "#1A1A2E";
const MUTED_TEXT = "#8B8B98";

type Mode = "otp" | "login" | "signup";
type OtpPurpose = "LOGIN" | "SIGNUP";

export default function LoginScreen() {
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const returnTo = params.returnTo && typeof params.returnTo === "string" ? params.returnTo : "/(tabs)/home";

  const [mode, setMode] = useState<Mode>("otp");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otpPhone, setOtpPhone] = useState("");
  const [otpName, setOtpName] = useState("");
  const [otpPurpose, setOtpPurpose] = useState<OtpPurpose>("LOGIN");

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const requestOtp = useAuthStore((s) => s.requestOtp);

  const goToApp = () => router.replace(returnTo as Href);
  const continueAsGuest = () => router.replace("/(tabs)/home");

  const handleRequestOtp = async () => {
    setError("");
    setInfo("");
    const targetPhone = otpPhone.trim();
    if (!targetPhone) return setError("Enter your mobile number.");
    if (!PHONE_RE.test(targetPhone.replace(/[\s-]/g, ""))) {
      return setError("Enter a valid 10-digit mobile number.");
    }
    if (otpPurpose === "SIGNUP" && otpName.trim().length < 2) {
      return setError("Enter your full name.");
    }

    setBusy(true);
    try {
      const res = await requestOtp(targetPhone, otpPurpose);
      const canProceed = res.delivered || res.message;
      if (canProceed) {
        router.push({
          pathname: "/otp-verify",
          params: {
            phone: targetPhone,
            purpose: otpPurpose,
            returnTo,
            name: otpPurpose === "SIGNUP" ? otpName.trim() : "",
          },
        });
      } else {
        setError("Could not send verification code. Please try again.");
      }
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Could not send verification code. Please check your number."
      );
    } finally {
      setBusy(false);
    }
  };

  const submitPasswordAuth = async () => {
    setError("");
    setInfo("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (mode === "signup") {
      if (name.trim().length < 2) return setError("Enter your full name.");
      if (!USERNAME_RE.test(username.trim()))
        return setError("Username must be 3–30 letters, numbers, dots or underscores.");
      if (!EMAIL_RE.test(email.trim())) return setError("Enter a valid email address.");
      if (!PHONE_RE.test(phone.trim())) return setError("Enter a valid mobile number.");
      if (password !== confirmPassword) return setError("Passwords do not match.");
    } else {
      const id = identifier.trim();
      if (!id) return setError("Enter your email, phone number or username.");
    }

    setBusy(true);
    try {
      if (mode === "signup")
        await signUp({
          email: email.trim(),
          phone: phone.trim(),
          username: username.trim().toLowerCase(),
          password,
          name: name.trim(),
        });
      else await signIn(identifier.trim(), password);
      goToApp();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
      >
          <View style={styles.skipRow}>
            <Pressable onPress={goToApp} hitSlop={8} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </View>

          <View style={styles.logoRow}>
            <RNImage
              source={logoFull}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.heroSection}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroHeading}>
                One App for
                {"\n"}
                All Your Needs
              </Text>
              <Text style={styles.heroSubtitle}>
                Food, Grocery, Mart, Taxi and more.
                {"\n"}
                Faster. Closer. Easier.
              </Text>
            </View>
            <View style={styles.heroIllustrationContainer}>
              <View style={styles.heroCircleBg} />
              <RNImage
                source={heroImage}
                style={styles.heroImage}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.authTabsContainer}>
            <Pressable
              style={[styles.authTab, mode === "otp" && styles.authTabActive]}
              onPress={() => {
                setMode("otp");
                setError("");
                setInfo("");
              }}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={16}
                color={mode === "otp" ? BRAND_ORANGE : MUTED_TEXT}
              />
              <Text
                style={[
                  styles.authTabText,
                  mode === "otp" ? styles.authTabTextActive : styles.authTabTextInactive,
                ]}
              >
                Phone OTP
              </Text>
            </Pressable>
            <Pressable
              style={[styles.authTab, mode !== "otp" && styles.authTabActivePassive]}
              onPress={() => {
                setMode("login");
                setError("");
                setInfo("");
              }}
            >
              <Ionicons
                name="lock-closed-outline"
                size={16}
                color={mode !== "otp" ? BRAND_ORANGE : MUTED_TEXT}
              />
              <Text
                style={[
                  styles.authTabText,
                  mode !== "otp" ? styles.authTabTextActive : styles.authTabTextInactive,
                ]}
              >
                Password
              </Text>
            </Pressable>
          </View>

          <View style={styles.loginCard}>
            <Text style={styles.loginCardHeading}>
              {mode === "otp"
                ? otpPurpose === "SIGNUP"
                  ? "Create your account"
                  : "Enter your mobile number"
                : mode === "signup"
                ? "Create your account"
                : "Sign in to your account"}
            </Text>
            <Text style={styles.loginCardSubtext}>
              {mode === "otp"
                ? "We'll send a verification code to your phone"
                : mode === "signup"
                ? "Fill your details to get started"
                : "Enter your credentials to continue"}
            </Text>

            {mode === "otp" ? (
              <View style={styles.formGap}>
                <View style={styles.purposeToggleSmall}>
                  <Pressable
                    style={[
                      styles.purposeButtonSmall,
                      otpPurpose === "LOGIN" && styles.purposeButtonSmallActive,
                    ]}
                    onPress={() => {
                      setOtpPurpose("LOGIN");
                      setError("");
                    }}
                  >
                    <Text
                      style={[
                        styles.purposeTextSmall,
                        otpPurpose === "LOGIN" && styles.purposeTextSmallActive,
                      ]}
                    >
                      Sign In
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.purposeButtonSmall,
                      otpPurpose === "SIGNUP" && styles.purposeButtonSmallActive,
                    ]}
                    onPress={() => {
                      setOtpPurpose("SIGNUP");
                      setError("");
                    }}
                  >
                    <Text
                      style={[
                        styles.purposeTextSmall,
                        otpPurpose === "SIGNUP" && styles.purposeTextSmallActive,
                      ]}
                    >
                      New Account
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.phoneInputOuter}>
                  <View style={styles.phoneInputInner}>
                    <View style={styles.countryCodeRow}>
                      <Text style={styles.flagEmoji}>🇮🇳</Text>
                      <Text style={styles.countryCode}>+91</Text>
                      <Ionicons name="chevron-down" size={14} color={MUTED_TEXT} />
                    </View>
                    <View style={styles.phoneDivider} />
                    <TextInput
                      style={styles.phoneTextInput}
                      placeholder="Enter mobile number"
                      placeholderTextColor={MUTED_TEXT}
                      value={otpPhone}
                      onChangeText={setOtpPhone}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                </View>

                {otpPurpose === "SIGNUP" ? (
                  <View style={styles.altFieldOuter}>
                    <TextInput
                      style={styles.altFieldInput}
                      placeholder="Enter your full name"
                      placeholderTextColor={MUTED_TEXT}
                      value={otpName}
                      onChangeText={setOtpName}
                      autoCapitalize="words"
                    />
                  </View>
                ) : null}

                {info ? <Text style={styles.infoText}>{info}</Text> : null}
                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <Pressable
                  style={({ pressed }) => [
                    styles.sendButton,
                    pressed && styles.sendButtonPressed,
                    busy && styles.sendButtonDisabled,
                  ]}
                  onPress={() => void handleRequestOtp()}
                  disabled={busy}
                >
                  <Text style={styles.sendButtonText}>
                    {busy ? "Sending code…" : "Send Verification Code"}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="#FFFFFF"
                    style={styles.sendButtonArrow}
                  />
                </Pressable>
              </View>
            ) : (
              <View style={styles.formGap}>
                {mode === "login" ? (
                  <View style={styles.altFieldOuter}>
                    <TextInput
                      style={styles.altFieldInput}
                      placeholder="Email / phone / username"
                      placeholderTextColor={MUTED_TEXT}
                      value={identifier}
                      onChangeText={setIdentifier}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                ) : (
                  <>
                    <View style={styles.altFieldOuter}>
                      <TextInput
                        style={styles.altFieldInput}
                        placeholder="Full name"
                        placeholderTextColor={MUTED_TEXT}
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                      />
                    </View>
                    <View style={styles.altFieldOuter}>
                      <TextInput
                        style={styles.altFieldInput}
                        placeholder="Username"
                        placeholderTextColor={MUTED_TEXT}
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                      />
                    </View>
                    <View style={styles.altFieldOuter}>
                      <TextInput
                        style={styles.altFieldInput}
                        placeholder="Mobile number"
                        placeholderTextColor={MUTED_TEXT}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                      />
                    </View>
                    <View style={styles.altFieldOuter}>
                      <TextInput
                        style={styles.altFieldInput}
                        placeholder="Email address"
                        placeholderTextColor={MUTED_TEXT}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </>
                )}
                <PasswordField
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                />
                {mode === "signup" ? (
                  <PasswordField
                    label="Confirm password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                ) : null}

                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                <Pressable
                  style={({ pressed }) => [
                    styles.sendButton,
                    pressed && styles.sendButtonPressed,
                    busy && styles.sendButtonDisabled,
                  ]}
                  onPress={() => void submitPasswordAuth()}
                  disabled={busy}
                >
                  <Text style={styles.sendButtonText}>
                    {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="#FFFFFF"
                    style={styles.sendButtonArrow}
                  />
                </Pressable>

                <Pressable
                  style={styles.modeSwitch}
                  onPress={() => {
                    setMode(mode === "signup" ? "login" : "signup");
                    setError("");
                    setInfo("");
                  }}
                >
                  <Text style={styles.modeSwitchText}>
                    {mode === "signup"
                      ? "Already have an account? Sign in"
                      : "New to Goocart? Create an account"}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.orDividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.guestButton,
              pressed && { opacity: 0.85 },
            ]}
            onPress={continueAsGuest}
          >
            <View style={styles.guestIconBg}>
              <Ionicons name="person-outline" size={18} color={DARK_TEXT} />
            </View>
            <View style={styles.guestTextStack}>
              <Text style={styles.guestTitle}>Continue as Guest</Text>
              <Text style={styles.guestSubtitle}>Browse & explore all services</Text>
            </View>
          </Pressable>

          <View style={styles.benefitsFooterSpacer} />

          <View style={styles.benefitsRow}>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIconCircle}>
                <Ionicons name="shield-checkmark-outline" size={16} color={BRAND_ORANGE} />
              </View>
              <Text style={styles.benefitTitle}>Safe & Secure</Text>
              <Text style={styles.benefitSubtitle}>Your data is protected</Text>
            </View>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIconCircle}>
                <Ionicons name="flash-outline" size={16} color={BRAND_ORANGE} />
              </View>
              <Text style={styles.benefitTitle}>Quick Access</Text>
              <Text style={styles.benefitSubtitle}>Get started in seconds</Text>
            </View>

            <View style={styles.benefitItem}>
              <View style={styles.benefitIconCircle}>
                <Ionicons name="heart-outline" size={16} color={BRAND_ORANGE} />
              </View>
              <Text style={styles.benefitTitle}>A Better Experience</Text>
              <Text style={styles.benefitSubtitle}>Personalized for you</Text>
            </View>
          </View>

          <View style={styles.footerWrap}>
            <Text style={styles.footerText}>
              By continuing, you agree to our{" "}
              <Text style={styles.footerLink}>Terms of Service</Text> and{" "}
              <Text style={styles.footerLink}>Privacy Policy</Text>.
            </Text>
          </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PasswordField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.altFieldOuter}>
      <TextInput
        style={[styles.altFieldInput, { paddingRight: 40 }]}
        placeholder={label}
        placeholderTextColor={MUTED_TEXT}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
      />
      <Pressable
        style={styles.visibilityToggle}
        hitSlop={8}
        onPress={() => setVisible((v) => !v)}
      >
        <Ionicons
          name={visible ? "eye-off-outline" : "eye-outline"}
          size={16}
          color={MUTED_TEXT}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 24,
  },

  skipRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    height: 22,
  },
  skipButton: {
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#787882",
  },

  logoRow: {
    alignItems: "flex-start",
    height: 24,
    marginTop: 2,
  },
  logoImage: {
    height: 24,
    width: 24 * (960 / 161),
  },

  heroSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    height: 88,
    marginTop: 10,
  },
  heroTextContainer: {
    flex: 1,
    paddingRight: 4,
    paddingTop: 20,
  },
  heroHeading: {
    fontSize: 26,
    fontWeight: "900",
    color: DARK_TEXT,
    lineHeight: 30,
    letterSpacing: -0.6,
    includeFontPadding: false,
  },
  heroSubtitle: {
    marginTop: 16,
    fontSize: 12,
    fontWeight: "400",
    color: MUTED_TEXT,
    lineHeight: 16,
  },
  heroIllustrationContainer: {
    width: 110,
    height: 88,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCircleBg: {
    position: "absolute",
    top: 0,
    right: -4,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FFE8DD",
    opacity: 0.55,
  },
  heroImage: {
    width: 280,
    height: 200,
    position: "absolute",
    top: -18,
    right: -40,
  },

  authTabsContainer: {
    flexDirection: "row",
    backgroundColor: "#F7F7F8",
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: "#EFEFF1",
    marginTop: 100,
  },
  authTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  authTabActive: {
    backgroundColor: BRAND_ORANGE_LIGHT,
    shadowColor: BRAND_ORANGE,
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  authTabActivePassive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  authTabText: {
    fontSize: 13,
    fontWeight: "700",
  },
  authTabTextActive: {
    color: BRAND_ORANGE,
  },
  authTabTextInactive: {
    color: MUTED_TEXT,
  },

  loginCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#F0EFF2",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    marginTop: 16,
  },
  loginCardHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: DARK_TEXT,
    letterSpacing: -0.1,
  },
  loginCardSubtext: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "400",
    color: MUTED_TEXT,
    lineHeight: 17,
  },
  formGap: {
    marginTop: 14,
    gap: 12,
  },

  purposeToggleSmall: {
    flexDirection: "row",
    borderRadius: 10,
    backgroundColor: "#F7F7F8",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EFEFF1",
  },
  purposeButtonSmall: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
  },
  purposeButtonSmallActive: {
    backgroundColor: BRAND_ORANGE,
  },
  purposeTextSmall: {
    fontSize: 11,
    fontWeight: "700",
    color: DARK_TEXT,
  },
  purposeTextSmallActive: {
    color: "#FFFFFF",
  },

  phoneInputOuter: {
    width: "100%",
  },
  phoneInputInner: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderWidth: 1,
    borderColor: "#E8E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
  },
  countryCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
    gap: 4,
  },
  flagEmoji: {
    fontSize: 18,
  },
  countryCode: {
    fontSize: 13,
    fontWeight: "600",
    color: DARK_TEXT,
  },
  phoneDivider: {
    width: 1,
    height: 18,
    backgroundColor: "#E8E7EB",
    marginHorizontal: 10,
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: DARK_TEXT,
    height: 48,
    padding: 0,
  },

  altFieldOuter: {
    position: "relative",
    width: "100%",
  },
  altFieldInput: {
    height: 48,
    borderWidth: 1,
    borderColor: "#E8E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: "500",
    color: DARK_TEXT,
    backgroundColor: "#FFFFFF",
  },
  visibilityToggle: {
    position: "absolute",
    right: 0,
    top: 0,
    height: 48,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  infoText: {
    fontSize: 11,
    fontWeight: "500",
    color: BRAND_ORANGE,
    textAlign: "center",
  },
  errorText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#DC2626",
    textAlign: "center",
  },

  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 12,
    backgroundColor: BRAND_ORANGE,
    gap: 8,
    shadowColor: BRAND_ORANGE,
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sendButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.995 }],
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.1,
  },
  sendButtonArrow: {
    marginLeft: 2,
  },

  modeSwitch: {
    alignItems: "center",
    paddingVertical: 2,
  },
  modeSwitchText: {
    fontSize: 11,
    fontWeight: "600",
    color: BRAND_ORANGE,
  },

  orDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E4E8",
  },
  orText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8B8B98",
  },

  guestButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F8",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#EFEFF1",
    marginTop: 12,
  },
  guestIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#EFEFF1",
  },
  guestTextStack: {
    flex: 1,
  },
  guestTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: DARK_TEXT,
  },
  guestSubtitle: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: "400",
    color: MUTED_TEXT,
  },

  benefitsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 2,
    gap: 4,
    marginTop: 16,
  },
  benefitItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  benefitIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND_ORANGE_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  benefitTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: DARK_TEXT,
    textAlign: "center",
  },
  benefitSubtitle: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "400",
    color: MUTED_TEXT,
    textAlign: "center",
    lineHeight: 13,
  },

  benefitsFooterSpacer: {
    flexGrow: 1,
    minHeight: 8,
  },

  footerWrap: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 26,
  },
  footerText: {
    fontSize: 10,
    fontWeight: "400",
    color: MUTED_TEXT,
    textAlign: "center",
    lineHeight: 14,
  },
  footerLink: {
    color: BRAND_ORANGE,
    fontWeight: "600",
  },
});
