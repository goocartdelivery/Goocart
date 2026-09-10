// Free open-source routing via OSRM's public demo server — no API key
// needed. Used as the default fallback when Google Directions isn't
// configured. The public instance has generous rate limits for low-traffic
// apps; self-hosting is trivial if those become a bottleneck.
export type OSRMRoute = {
  coordinates: Array<[number, number]>;
  distanceKm: number;
  durationMin: number;
} | null;

export async function getOSRMDirections(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
): Promise<OSRMRoute> {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}` +
      `?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      code: string;
      routes?: Array<{
        geometry?: { coordinates?: Array<[number, number]> };
        distance?: number;
        duration?: number;
      }>;
    };
    if (data.code !== "Ok" || !data.routes?.length) return null;
    const route = data.routes[0];
    const coords = route.geometry?.coordinates;
    if (!coords?.length) return null;
    return {
      coordinates: coords,
      distanceKm: Math.round((route.distance ?? 0) / 1000 * 10) / 10,
      durationMin: Math.round((route.duration ?? 0) / 60),
    };
  } catch {
    return null;
  }
}
