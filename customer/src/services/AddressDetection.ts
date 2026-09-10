import { ensureForegroundPermission, locationService } from "@/services/LocationService";
import { reverseGeocodeDetailed } from "@/services/PlacesService";

// detectAndFillCurrentLocation() — the master detection entry point used by
// the address form's "Use Current Location" button. It layers the existing
// primitives per the separation-of-concerns design:
//
//   Location layer    -> locationService (permission gate + one-shot GPS fix)
//   Geocoding layer   -> reverseGeocodeDetailed (device-native geocoder)
//   State / UI layer  -> the caller applies mergeDetectedFields to its form
//                        and saves through the existing Add-Address flow
//                        (useAddressStore.addAddress -> POST /addresses),
//                        which is what persists to the backend.
//
// It never writes to the backend directly: persistence flows through the
// normal Save action so a detected location behaves exactly like a manually
// typed one and can still be edited before it's stored.

export type DetectedAddress = {
  street: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
};

export type DetectionErrorReason =
  | "permission"
  | "permanently-denied"
  | "services-disabled"
  | "timeout"
  | "unavailable"
  | "geocode-failed";

export type DetectionOutcome =
  | { ok: true; location: DetectedAddress }
  | { ok: false; reason: DetectionErrorReason; message: string };

const REASON_MESSAGES: Record<DetectionErrorReason, string> = {
  permission: "Location permission is needed to pin this address.",
  "permanently-denied": "Location access is blocked on this device. Enable it in Settings, then try again.",
  "services-disabled": "Turn on device location (GPS) to detect your address.",
  timeout: "Couldn't get a GPS fix in time. Try again outdoors or near a window.",
  unavailable: "Couldn't detect your location. Please try again.",
  "geocode-failed": "Couldn't find an address at this location. Move a little and try again, or enter it manually.",
};

async function runDetection(): Promise<DetectionOutcome> {
  try {
    // An explicit tap on "Use Current Location" is a clear intent, so it may
    // prompt for permission (unlike the welcome flow, which never re-prompts
    // on its own). A permanent OS-level denial can't be re-prompted, so it
    // maps to the "check Settings" message instead.
    const permission = await ensureForegroundPermission();
    if (permission !== "granted") {
      const reason = permission === "permanently-denied" ? "permanently-denied" : "permission";
      return { ok: false, reason, message: REASON_MESSAGES[reason] };
    }

    const fix = await locationService.getCoordinates();
    if (fix.state !== "success") {
      return { ok: false, reason: fix.state, message: REASON_MESSAGES[fix.state] };
    }

    const place = await reverseGeocodeDetailed(fix.latitude, fix.longitude);
    if (!place) return { ok: false, reason: "geocode-failed", message: REASON_MESSAGES["geocode-failed"] };

    return {
      ok: true,
      location: {
        street: place.street,
        city: place.city,
        state: place.state,
        pincode: place.pincode,
        latitude: fix.latitude,
        longitude: fix.longitude,
      },
    };
  } catch {
    return { ok: false, reason: "unavailable", message: REASON_MESSAGES.unavailable };
  }
}

let detectionInFlight: Promise<DetectionOutcome> | null = null;

// Master function. Single-flight guard so rapid taps share one GPS fix
// instead of stacking concurrent locator calls; coordinates are never logged
// or echoed into error messages — only opaque, user-facing reasons travel
// out of the Location layer.
export function detectAndFillCurrentLocation(): Promise<DetectionOutcome> {
  if (detectionInFlight) return detectionInFlight;
  detectionInFlight = runDetection().finally(() => {
    detectionInFlight = null;
  });
  return detectionInFlight;
}

export type FillableAddressFields = { street: string; city: string; state: string; pincode: string };

// Fill-only merge: a detected location fills fields the user hasn't typed
// yet and never clobbers a manual edit, and a failed detection (outcome.ok
// false) leaves the caller's existing form entirely untouched.
export function mergeDetectedFields(current: FillableAddressFields, detected: FillableAddressFields): FillableAddressFields {
  return {
    street: current.street || detected.street,
    city: current.city || detected.city,
    state: current.state || detected.state,
    pincode: current.pincode || detected.pincode,
  };
}