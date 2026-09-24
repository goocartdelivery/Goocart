// Turns a free-text address into coordinates so admins never have to look
// up or type latitude/longitude by hand when onboarding a vendor.
//
// Uses OpenStreetMap's Nominatim search API — no API key/account needed,
// which matters since this project has no geocoding credentials of its
// own. Nominatim's usage policy caps public requests at ~1/second and
// requires an identifying User-Agent; this is admin-only, low-volume
// traffic (one lookup per vendor create/edit), well within that limit.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// A small set of service-area centroids keeps local onboarding usable when
// Nominatim is unavailable (for example, on a development machine without
// outbound network access). These are intentionally city-level fallbacks;
// a later edit can replace them with a precise geocoded address.
const FALLBACK_LOCATIONS: Array<{ matches: string[]; latitude: number; longitude: number }> = [
  { matches: ["vijayawada"], latitude: 16.5062, longitude: 80.6480 },
  { matches: ["jangareddigudem", "jangareddy gudem"], latitude: 17.1218, longitude: 81.2950 },
];

export function fallbackGeocodeAddress(query: string): { latitude: number; longitude: number } | null {
  const normal = query.toLowerCase();
  const match = FALLBACK_LOCATIONS.find((location) => location.matches.some((name) => normal.includes(name)));
  return match ? { latitude: match.latitude, longitude: match.longitude } : null;
}

export async function geocodeAddress(query: string): Promise<{ latitude: number; longitude: number } | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  try {
    const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url, { headers: { "User-Agent": "Goocart-Admin/1.0 (vendor onboarding geocoding)" } });
    if (!res.ok) return null;

    const results = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    const first = results[0];
    if (!first?.lat || !first?.lon) return null;

    const latitude = Number(first.lat);
    const longitude = Number(first.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  } catch {
    return null;
  }
}
