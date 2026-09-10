const baseConfig = require("./app.json");

// A missing or placeholder Maps key must never be baked into a build: on
// Android, react-native-maps renders against the key in the manifest, and a
// fake string produces the blank/gray map this app shipped with before. The
// only legitimate values are real, Google-Cloud-restricted keys supplied via
// the environment at build time.
function env(name) {
  const value = process.env[name]?.trim();
  return value || null;
}

const PLACEHOLDER = /^REPLACE_WITH|^(YOUR_|TODO|PLACEHOLDER)/i;

function firstRealKey(...names) {
  for (const name of names) {
    const value = env(name);
    if (value && !PLACEHOLDER.test(value)) return value;
  }
  return null;
}

// EAS sets EAS_BUILD for cloud builds and EAS_BUILD_LOCAL for `--local`
// builds. That is the one place a silently-blank map is unacceptable, so a
// release Android build without a real key fails fast instead of shipping a
// broken map.
const isReleaseBuild = process.env.EAS_BUILD === "true" || process.env.EAS_BUILD_LOCAL === "true";

module.exports = () => {
  const expo = JSON.parse(JSON.stringify(baseConfig.expo));

  const androidMapsKey = firstRealKey(
    "GOOCART_ANDROID_GOOGLE_MAPS_API_KEY",
    "EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY",
  );
  const iosMapsKey = firstRealKey(
    "GOOCART_IOS_GOOGLE_MAPS_API_KEY",
    "EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY",
  );

  if (isReleaseBuild && !androidMapsKey) {
    throw new Error(
      "Android release build has no Google Maps API key. Google Maps cannot " +
        "render on Android without one, so this build would ship a blank map. " +
        "Set GOOCART_ANDROID_GOOGLE_MAPS_API_KEY to a real key restricted to " +
        "package com.goocart.customer (EAS Project → Environment variables, or " +
        "`eas env:create`), then rebuild.",
    );
  }

  // Inject keys only when real. iOS uses the default Apple Maps provider, so
  // its key is optional; a Google key is only added if one was supplied.
  if (androidMapsKey) {
    expo.android = {
      ...expo.android,
      config: {
        ...expo.android?.config,
        googleMaps: { ...expo.android?.config?.googleMaps, apiKey: androidMapsKey },
      },
    };
  }
  if (iosMapsKey) {
    expo.ios = {
      ...expo.ios,
      config: { ...expo.ios?.config, googleMapsApiKey: iosMapsKey },
    };
  }

  return { expo };
};