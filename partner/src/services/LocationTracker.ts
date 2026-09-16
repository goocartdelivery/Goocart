import * as Location from "expo-location";
import { apiPost } from "@/services/apiClient";

const ACTIVE_UPDATE_INTERVAL_MS = 7000; // within the spec's 5-10s window
const IDLE_UPDATE_INTERVAL_MS = 30_000; // 30s when online but no active job
const MIN_DISTANCE_METERS = 15; // avoid spamming updates while stationary

let activeSubscription: Location.LocationSubscription | null = null;
let idleSubscription: Location.LocationSubscription | null = null;

async function requestPermission(): Promise<{ granted: boolean; reason?: string }> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return { granted: false, reason: "Location permission is required to deliver orders." };
  return { granted: true };
}

function sendLocation(position: Location.LocationObject): void {
  void apiPost("/api/v1/partner/location", {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    heading: position.coords.heading,
    speed: position.coords.speed,
  }).catch(() => {
    // A dropped connection here shouldn't crash the delivery flow — the
    // next tick tries again.
  });
}

/**
 * High-frequency tracking while a delivery is active (spec section 32).
 */
export async function startLocationTracking(): Promise<{ ok: boolean; reason?: string }> {
  if (activeSubscription) return { ok: true };

  // Stop idle tracking if it's running — active tracking takes over.
  stopIdleTracking();

  const perm = await requestPermission();
  if (!perm.granted) return { ok: false, reason: perm.reason };

  activeSubscription = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, timeInterval: ACTIVE_UPDATE_INTERVAL_MS, distanceInterval: MIN_DISTANCE_METERS },
    sendLocation,
  );
  return { ok: true };
}

/**
 * Low-frequency "idle" tracking while the partner is online but has no
 * active job. Ensures the partner's location stays current for nearby
 * searches without draining the battery.
 */
export async function startIdleTracking(): Promise<{ ok: boolean; reason?: string }> {
  if (idleSubscription) return { ok: true };
  // Don't start idle tracking if active tracking is running.
  if (activeSubscription) return { ok: true };

  const perm = await requestPermission();
  if (!perm.granted) return { ok: false, reason: perm.reason };

  idleSubscription = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.Balanced, timeInterval: IDLE_UPDATE_INTERVAL_MS, distanceInterval: MIN_DISTANCE_METERS },
    sendLocation,
  );
  return { ok: true };
}

function safeRemove(sub: Location.LocationSubscription | null): void {
  if (!sub) return;
  try {
    sub.remove();
  } catch {
    // LocationEventEmitter.removeSubscription may not exist in Expo Go;
    // the subscription will be garbage-collected regardless.
  }
}

export function stopLocationTracking(): void {
  safeRemove(activeSubscription);
  activeSubscription = null;
}

export function stopIdleTracking(): void {
  safeRemove(idleSubscription);
  idleSubscription = null;
}

export function isTrackingLocation(): boolean {
  return activeSubscription !== null || idleSubscription !== null;
}
