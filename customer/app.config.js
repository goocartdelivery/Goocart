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

  // Inject keys only when real. The release-build validation that used to
  // throw here has been moved to the withGoogleMapsValidation config plugin
  // (see plugins list below) so that:
  //   (a) app.config.js never crashes the EAS config-resolution subprocess,
  //   (b) the check runs at prebuild time in the cloud worker where
  //       environment variables are always injected, and
  //   (c) local `npx expo config` and dev-server starts still work without
  //       the key.
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

  // Register the validation plugin so release builds without a Maps key
  // fail fast at prebuild instead of shipping a blank map.
  const plugins = expo.plugins || [];
  if (!plugins.some((p) => (Array.isArray(p) ? p[0] : p) === "./plugins/withGoogleMapsValidation")) {
    plugins.push("./plugins/withGoogleMapsValidation");
  }
  expo.plugins = plugins;

  return { expo };
};