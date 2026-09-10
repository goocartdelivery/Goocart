import * as Location from "expo-location";

export type ResolvedLocation = {
  latitude: number;
  longitude: number;
  city: string;
  region: string;
  // Street-level detail from reverse geocoding (house/building + street,
  // or the nearest named place) — this is the "exact" location shown on
  // the home screen, distinct from city/region which are used as a
  // fallback when reverse geocoding can't resolve anything more precise.
  address: string;
};

// Why the current location could not be resolved. Each maps to a distinct
// user-facing fallback in the LocationStatusBar (permission prompt, open
// settings, retry) so the Welcome/Sign-In screens never hang silently.
export type LocationUnavailableReason =
  | "permission"
  | "permanently-denied"
  | "services-disabled"
  | "timeout"
  | "unavailable";

export type LocationResolution =
  | { state: "success"; location: ResolvedLocation }
  | { state: LocationUnavailableReason };

// Foreground-only location, safe for Expo Go. Background tracking (needed for
// live delivery-partner/rider location in production) requires a custom dev
// build and is intentionally NOT implemented here — see LocationService.md
// note below. Any future background variant should implement this same
// interface so screens never need to know which one is active.
export interface LocationServiceInterface {
  requestPermission(): Promise<boolean>;
  hasPermission(): Promise<boolean>;
  canAskAgain(): Promise<boolean>;
  getCurrentLocation(): Promise<ResolvedLocation | null>;
  // A single GPS fix with no reverse geocoding and no permission prompt —
  // the Location layer for "give me coordinates and a reason if you can't".
  // Callers (resolve, detect-and-fill) layer geocoding and permission
  // policy on top without ever repeating the raw-fix semantics.
  getCoordinates(): Promise<
    | { state: "success"; latitude: number; longitude: number }
    | { state: "services-disabled" | "timeout" | "unavailable" }
  >;
  // Never prompts on its own — callers gate permission prompts. Returns a
  // reason so the UI can distinguish denied / permanently-denied /
  // services-disabled / timeout instead of collapsing everything to null.
  resolve(): Promise<LocationResolution>;
}

class ForegroundLocationService implements LocationServiceInterface {
  // Balanced can take a long time on a cold GPS lock, especially indoors.
  // Cap it so the welcome screen can't spin forever and the UI always gets a
  // actionable answer.
  private static readonly FIX_TIMEOUT_MS = 12_000;

  async requestPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  }

  async hasPermission(): Promise<boolean> {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === "granted";
  }

  async canAskAgain(): Promise<boolean> {
    const { canAskAgain } = await Location.getForegroundPermissionsAsync();
    return canAskAgain;
  }

  private async withFixTimeout<T>(task: Promise<T>): Promise<T> {
    return Promise.race([
      task,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("location-fix-timeout")), ForegroundLocationService.FIX_TIMEOUT_MS);
      }),
    ]);
  }

  async getCurrentLocation(): Promise<ResolvedLocation | null> {
    try {
      const granted = await this.requestPermission();
      if (!granted) return null;
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const city = place?.city || place?.subregion || "Current location";
      // Prefer the most specific detail reverse geocoding gives us — a
      // named place/house number, street and district — deduped against
      // each other AND against the city (rural reverse-geocode results
      // commonly repeat the same place name across name/district/city),
      // falling back to just the city if nothing more precise survives.
      const candidates = [place?.name, place?.street, place?.district, city].filter((part): part is string => Boolean(part));
      const seen = new Set<string>();
      const address = candidates
        .filter((part) => {
          const key = part.trim().toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .join(", ");
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        city,
        region: place?.region || "",
        address: address || city,
      };
    } catch {
      return null;
    }
  }

  async getCoordinates(): Promise<
    | { state: "success"; latitude: number; longitude: number }
    | { state: "services-disabled" | "timeout" | "unavailable" }
  > {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) return { state: "services-disabled" };

      let position: Location.LocationObject;
      try {
        position = await this.withFixTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      } catch (e) {
        if (e instanceof Error && e.message === "location-fix-timeout") return { state: "timeout" };
        // getCurrentPositionAsync throws when the GPS provider drops
        // mid-fix (airplane mode, toggled-off location, no satellites
        // indoors) even though high-level "services" reported enabled.
        return { state: "services-disabled" };
      }

      const { latitude, longitude } = position.coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return { state: "unavailable" };
      return { state: "success", latitude, longitude };
    } catch {
      return { state: "unavailable" };
    }
  }

  async resolve(): Promise<LocationResolution> {
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        // Callers decide whether to prompt (requestPermission) — resolve()
        // itself never shows a dialog, so the Welcome/Sign-In status UI can
        // render an explicit "Enable location" affordance instead.
        return perm.canAskAgain === false ? { state: "permanently-denied" } : { state: "permission" };
      }

      const fix = await this.getCoordinates();
      if (fix.state !== "success") return { state: fix.state };

      let place: Location.LocationGeocodedAddress | null = null;
      try {
        [place] = await Location.reverseGeocodeAsync({
          latitude: fix.latitude,
          longitude: fix.longitude,
        });
      } catch {
        place = null;
      }

      const city = place?.city || place?.subregion || "Current location";
      const candidates = [place?.name, place?.street, place?.district, city].filter((part): part is string => Boolean(part));
      const seen = new Set<string>();
      const address = candidates
        .filter((part) => {
          const key = part.trim().toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .join(", ");

      return {
        state: "success",
        location: {
          latitude: fix.latitude,
          longitude: fix.longitude,
          city,
          region: place?.region || "",
          address: address || city,
        },
      };
    } catch {
      return { state: "unavailable" };
    }
  }
}

export const locationService: LocationServiceInterface = new ForegroundLocationService();

export type PermissionOutcome = "granted" | "denied" | "permanently-denied";

// Shared permission policy for explicit user actions (button taps such as
// "Use Current Location" or "Choose on Map"): an explicit intent may prompt,
// but a permanent OS-level denial cannot be re-prompted and maps to the
// "check Settings" outcome. Callers get back a reason they can surface, never
// a silent null. The welcome flow deliberately does NOT use this — it never
// re-prompts on its own.
export async function ensureForegroundPermission(service: LocationServiceInterface = locationService): Promise<PermissionOutcome> {
  if (await service.hasPermission()) return "granted";
  if (await service.requestPermission()) return "granted";
  return (await service.canAskAgain()) ? "denied" : "permanently-denied";
}