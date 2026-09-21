import Constants from "expo-constants";
import { Platform } from "react-native";

// Where the app finds the Goocart backend.
//
// Resolution order:
//   1. EXPO_PUBLIC_API_URL — baked in at build time. REQUIRED for a real APK,
//      because a standalone build has no Metro server to infer a host from.
//   2. In Expo Go / dev, derive the host from the Metro bundler URL the device
//      already connected to (your machine's LAN IP). "localhost" would resolve
//      to the phone itself, so it is never a useful default on a device.
//
// If neither works we surface `apiConfigError` and let the UI show a clear
// message. Throwing here would crash the app before it can render anything.

const PRODUCTION_API_URL = "https://api.yetrixtechnologies.com";
const DEV_BACKEND_PORT = 3001;

function resolveProductionUrl(explicit?: string): { url: string; error: string | null } {
  const candidate = (explicit || PRODUCTION_API_URL).replace(/\/$/, "");

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "https:") {
      throw new Error("not a public HTTPS endpoint");
    }
  } catch {
    return {
      url: "",
      error:
        "The release backend must be a public HTTPS URL. Set EXPO_PUBLIC_API_URL and rebuild.",
    };
  }

  return { url: candidate, error: null };
}

function inferDevHost(): string | null {
  const constants = Constants as unknown as {
    expoConfig?: { hostUri?: string };
    manifest?: { debuggerHost?: string };
    manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
  };
  const hostUri =
    constants.expoConfig?.hostUri ??
    constants.manifest?.debuggerHost ??
    constants.manifest2?.extra?.expoGo?.debuggerHost ??
    null;
  if (typeof hostUri !== "string") return null;
  const host = hostUri.split(":")[0];
  if (!host) return null;
  return host;
}

function resolve(): { url: string; error: string | null } {
  let explicit = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!__DEV__) return resolveProductionUrl(explicit);

  if (explicit) {
    let url = explicit.replace(/\/$/, "");
    if (Platform.OS === "web" && url.includes("10.0.2.2")) {
      const hostname = typeof window !== "undefined" && window.location?.hostname ? window.location.hostname : "localhost";
      url = url.replace("10.0.2.2", hostname);
    }
    return { url, error: null };
  }

  if (Platform.OS === "web") {
    const hostname = typeof window !== "undefined" && window.location?.hostname ? window.location.hostname : "localhost";
    return { url: `http://${hostname}:${DEV_BACKEND_PORT}`, error: null };
  }

  const host = inferDevHost();
  if (host) return { url: `http://${host}:${DEV_BACKEND_PORT}`, error: null };

  return {
    url: "",
    error:
      "Development backend not found. Set EXPO_PUBLIC_API_URL in customer/.env and restart Expo.",
  };
}

const resolved = resolve();

export const API_URL = resolved.url;
export const apiConfigError = resolved.error;
export const API_TIMEOUT_MS = 12000;

// Whether React Native Maps can actually render on this device/build.
// Android maps and PROVIDER_GOOGLE always need a real, restricted Google Maps
// SDK key baked into the manifest at build time (see app.config.js) — with a
// missing or placeholder key the native map renders blank. iOS uses the
// default Apple Maps provider and needs no key, and Expo Go ships its own
// key, so both always work. Screens gate on this before rendering a map so a
// build that can't draw one shows an actionable message instead of a dead
// gray rectangle.
export function mapsSupportedInThisBuild(): boolean {
  if (Platform.OS !== "android") return true;
  if (Constants.executionEnvironment === Constants.ExecutionEnvironment.StoreClient) return true;
  const googleMaps = (
    Constants.expoConfig?.android as
      | { config?: { googleMaps?: { apiKey?: string } } }
      | undefined
  )?.config?.googleMaps;
  const key = googleMaps?.apiKey;
  return Boolean(key && !/^REPLACE_WITH|^(YOUR_|TODO|PLACEHOLDER)/i.test(key));
}
