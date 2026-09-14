import { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { PrimaryButton } from "@/components/PrimaryButton";
import { PublicGate } from "@/components/AuthGates";
import { colors, radius, typography } from "@/theme";

const heroImage = require("../assets/images/vendorWelcome.webp");
const logoFull = require("../assets/images/logo-full.png");

export default function WelcomeScreen() {
  const [busy, setBusy] = useState(false);
  const { height, width } = useWindowDimensions();

  const getStarted = () => {
    if (busy) return;

    setBusy(true);

    // Entry into authentication flow.
    router.replace("/login");
  };

  /*
   * Keep the image responsive.
   * On smaller phones, reduce the image height slightly.
   */
  const imageHeight =
    height < 700
      ? Math.min(height * 0.34, 260)
      : Math.min(height * 0.39, 310);

  return (
    <PublicGate>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.content}>

          {/* ================= HEADER ================= */}
          <View style={styles.header}>
            <Image
              source={logoFull}
              style={[
                styles.logo,
                {
                  width: Math.min(width * 0.68, 290),
                },
              ]}
              resizeMode="contain"
              accessibilityLabel="Goocart"
            />

            <View style={styles.vendorPill}>
              <Text style={styles.vendorPillText}>VENDOR</Text>
            </View>
          </View>

          {/* ================= HERO TEXT ================= */}
          <View style={styles.hero}>
            <Text style={styles.title}>
              Manage your restaurant
            </Text>

            <Text style={styles.subtitle}>
              Receive orders, manage your menu and grow your business.
            </Text>
          </View>

          {/* ================= FOOD IMAGE ================= */}
          <View
            style={[
              styles.imageContainer,
              {
                height: imageHeight,
              },
            ]}
          >
            <Image
              source={heroImage}
              style={styles.image}
              resizeMode="contain"
              accessibilityLabel="Restaurant food"
            />
          </View>

          {/* ================= FOOTER ================= */}
          <View style={styles.footer}>
            <Text style={styles.trust}>
              Trusted by restaurant owners across your city
            </Text>

            <PrimaryButton
              label={busy ? "One moment…" : "Get Started"}
              onPress={getStarted}
              disabled={busy}
            />
          </View>

        </View>
      </SafeAreaView>
    </PublicGate>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },

  content: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",

    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 34,

    justifyContent: "space-between",
  },

  /* ================= HEADER ================= */

  header: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  logo: {
    height: 42,
  },

  vendorPill: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,

    paddingHorizontal: 20,
    paddingVertical: 6,
  },

  vendorPillText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 3,
  },

  /* ================= HERO ================= */

  hero: {
    alignItems: "center",
    paddingHorizontal: 4,
    marginTop: 8,
  },

  title: {
    ...typography.display,

    fontSize: 25,
    lineHeight: 31,

    textAlign: "center",
    color: colors.dark,
  },

  subtitle: {
    ...typography.body,

    color: colors.muted,
    textAlign: "center",

    lineHeight: 20,

    maxWidth: 330,

    marginTop: 6,
  },

  /* ================= IMAGE ================= */

  imageContainer: {
    width: "100%",

    alignItems: "center",
    justifyContent: "center",

    marginVertical: 4,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  /* ================= FOOTER ================= */

  footer: {
    width: "100%",

    gap: 12,

    paddingBottom: 2,
  },

  trust: {
    ...typography.caption,

    color: colors.muted,
    textAlign: "center",

    lineHeight: 18,

    paddingHorizontal: 10,
  },
});