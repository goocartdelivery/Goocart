const { withDangerousMod } = require("expo/config-plugins");

/**
 * Config plugin that validates the Google Maps API key at prebuild time.
 *
 * This runs during `npx expo prebuild` (which EAS Build invokes inside the
 * cloud worker), NOT during app.config.js resolution. By this stage the EAS
 * environment variables are fully injected into process.env, so the check
 * is reliable.
 *
 * Why a plugin instead of a throw in app.config.js?
 * -------------------------------------------------
 * EAS CLI evaluates app.config.js locally (on the developer's machine) to
 * read project metadata before uploading. At that point:
 *   • EAS_BUILD is not set (it is only set on the cloud worker).
 *   • EAS environment variables (particularly SENSITIVE ones) may not yet be
 *     in process.env.
 *
 * A throw during config resolution therefore crashes the EAS CLI subprocess
 * (on Windows this manifests as exit code 3221226505 / 0xC0000409). Moving
 * the guard here avoids that while still failing fast before any APK is
 * produced.
 */

const PLACEHOLDER = /^REPLACE_WITH|^(YOUR_|TODO|PLACEHOLDER)/i;

function firstRealKey(...names) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value && !PLACEHOLDER.test(value)) return value;
  }
  return null;
}

module.exports = function withGoogleMapsValidation(config) {
  return withDangerousMod(config, [
    "android",
    (mod) => {
      const isReleaseBuild =
        process.env.EAS_BUILD === "true" ||
        process.env.EAS_BUILD_LOCAL === "true";

      const androidMapsKey = firstRealKey(
        "GOOCART_ANDROID_GOOGLE_MAPS_API_KEY",
        "EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY",
      );

      if (isReleaseBuild && !androidMapsKey) {
        throw new Error(
          "Android release build has no Google Maps API key. Google Maps " +
            "cannot render on Android without one, so this build would ship " +
            "a blank map.\n\n" +
            "Set GOOCART_ANDROID_GOOGLE_MAPS_API_KEY to a real key " +
            "restricted to package com.goocart.customer.\n" +
            "  → EAS Dashboard > Project > Environment variables, or\n" +
            "  → eas env:create --environment preview --name GOOCART_ANDROID_GOOGLE_MAPS_API_KEY\n\n" +
            "Then rebuild.",
        );
      }

      return mod;
    },
  ]);
};
