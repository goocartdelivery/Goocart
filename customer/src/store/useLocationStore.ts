import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { locationService, type LocationUnavailableReason } from "@/services/LocationService";

const STORAGE_KEY = "goocart.location.v1";
// Marks that the user was asked for location permission and declined (but
// could still be asked again). Persisted so the welcome flow never re-prompts
// on every launch after an explicit "no" — only the in-status "Enable
// location" action re-asks, keeping the app respectful of a declined choice.
const DENIED_KEY = "goocart.location.denied.v1";

export type SelectedLocation = {
  label: string;
  // Exact, human-readable location (street/place + city) shown on the home
  // screen. Falls back to city for the preset Home/Work entries, which have
  // no street-level detail of their own.
  address: string;
  city: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
};

export const DEMO_LOCATIONS: SelectedLocation[] = [
  { label: "Home", address: "Jangareddigudem", city: "Jangareddigudem", region: "Andhra Pradesh", latitude: 17.4362, longitude: 81.2661 },
  { label: "Work", address: "Vijayawada", city: "Vijayawada", region: "Andhra Pradesh", latitude: 16.5062, longitude: 80.648 },
];

export type LocationStatus = "idle" | "fetching" | "detected" | "unavailable";

type LocationState = {
  selected: SelectedLocation | null;
  hasHydrated: boolean;
  // Recorded once during hydrate(): true when a location was already cached
  // on this launch. Used to distinguish "returning user" (skip to home) from
  // "first run" (welcome splash detects location → sign-in) even though
  // `selected` may later be filled by detection on first run.
  hasCachedLocation: boolean;
  isResolving: boolean;
  // UI state machine for the Welcome/Sign-In location status pill.
  status: LocationStatus;
  statusReason: LocationUnavailableReason | null;
  deniedAsked: boolean;
  hydrate: () => Promise<void>;
  // Dedicated flow: checks permission (prompting unless forcePrompt is false
  // and the user already declined once), fetches GPS with a timeout,
  // reverse-geocodes, caches and updates `selected`. Never runs twice at once.
  detectCurrentLocation: (forcePrompt?: boolean) => Promise<boolean>;
  // Background refresh with no permission prompt and no status flip to
  // "unavailable": uses the cache immediately on launch, silently updates it
  // when the user has moved. Called once from the root layout.
  refreshCurrentLocation: () => Promise<void>;
  // Back-compat alias used by older callers (returns success boolean only).
  resolveCurrentLocation: () => Promise<boolean>;
  chooseLocation: (location: SelectedLocation) => Promise<void>;
};

// zustand's set cannot await, so a module-level handle dedupes concurrent
// detect calls and lets multiple screens share one in-flight resolution.
let detectInFlight: Promise<boolean> | null = null;

export const useLocationStore = create<LocationState>((set, get) => ({
  selected: null,
  hasHydrated: false,
  hasCachedLocation: false,
  isResolving: false,
  status: "idle",
  statusReason: null,
  deniedAsked: false,

  hydrate: async () => {
    try {
      const [raw, deniedRaw] = await Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(DENIED_KEY)]);
      set({
        selected: raw ? (JSON.parse(raw) as SelectedLocation) : null,
        hasCachedLocation: raw !== null,
        deniedAsked: deniedRaw === "1",
        hasHydrated: true,
      });
    } catch {
      set({ selected: null, hasCachedLocation: false, deniedAsked: false, hasHydrated: true });
    }
  },

  detectCurrentLocation: (forcePrompt = false) => {
    if (detectInFlight) return detectInFlight;
    detectInFlight = (async () => {
      set({ isResolving: true, status: "fetching", statusReason: null });
      try {
        const granted = await locationService.hasPermission();
        if (!granted) {
          // Never re-prompt automatically after an explicit decline; the
          // status pill's "Enable location" action calls us with forcePrompt.
          if (!forcePrompt && get().deniedAsked) {
            set({ isResolving: false, status: "unavailable", statusReason: "permission" });
            return false;
          }
          const ok = await locationService.requestPermission();
          const canAskAgain = await locationService.canAskAgain();
          if (!ok) {
            await AsyncStorage.setItem(DENIED_KEY, "1");
            set({ deniedAsked: true, isResolving: false, status: "unavailable", statusReason: canAskAgain ? "permission" : "permanently-denied" });
            return false;
          }
          await AsyncStorage.removeItem(DENIED_KEY);
          set({ deniedAsked: false });
        } else if (get().deniedAsked) {
          await AsyncStorage.removeItem(DENIED_KEY);
          set({ deniedAsked: false });
        }

        const resolution = await locationService.resolve();
        if (resolution.state !== "success") {
          set({ isResolving: false, status: "unavailable", statusReason: resolution.state });
          return false;
        }

        const location: SelectedLocation = {
          label: "Current location",
          address: resolution.location.address,
          city: resolution.location.city,
          region: resolution.location.region,
          latitude: resolution.location.latitude,
          longitude: resolution.location.longitude,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(location));
        set({ selected: location, isResolving: false, status: "detected", statusReason: null });
        return true;
      } catch {
        set({ isResolving: false, status: "unavailable", statusReason: "unavailable" });
        return false;
      } finally {
        detectInFlight = null;
      }
    })();
    return detectInFlight;
  },

  refreshCurrentLocation: async () => {
    try {
      // Silent by design: no permission prompt, and failures keep the cached
      // location untouched instead of flipping the UI to "unavailable".
      if (!(await locationService.hasPermission())) return;
      const resolution = await locationService.resolve();
      if (resolution.state !== "success") return;
      const { latitude, longitude, city, region, address } = resolution.location;
      const current = get().selected;
      if (current && current.city === city && current.address === address) return;
      const location: SelectedLocation = { label: "Current location", address, city, region, latitude, longitude };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(location));
      set({ selected: location, status: "detected", statusReason: null });
    } catch {
      // Background refresh must never throw into the root layout.
    }
  },

  resolveCurrentLocation: async () => get().detectCurrentLocation(true),

  chooseLocation: async (location: SelectedLocation) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(location));
    set({ selected: location, status: "detected", statusReason: null });
  },
}));