import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Platform } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import { apiGet } from "@/services/apiClient";
import { colors, radius } from "@/theme";

type Props = {
  pickup: { latitude: number; longitude: number; address: string };
  drop: { latitude: number; longitude: number; address: string };
  height?: number;
};

type DirectionRoute = {
  coordinates: Array<[number, number]>;
  distanceKm: number;
  durationMin: number;
};

export function RideMapPreview({ pickup, drop, height = 200 }: Props) {
  const [route, setRoute] = useState<DirectionRoute | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ route: DirectionRoute | null }>("/api/v1/customer/directions", {
      originLat: pickup.latitude,
      originLng: pickup.longitude,
      destLat: drop.latitude,
      destLng: drop.longitude,
    })
      .then((data) => { if (!cancelled) setRoute(data.route); })
      .catch(() => { if (!cancelled) setRoute(null); });
    return () => { cancelled = true; };
  }, [pickup.latitude, pickup.longitude, drop.latitude, drop.longitude]);

  const coords = route?.coordinates?.map(([lng, lat]) => ({ latitude: lat, longitude: lng })) ?? [];
  const hasRoute = coords.length > 0;

  const midLat = (pickup.latitude + drop.latitude) / 2;
  const midLng = (pickup.longitude + drop.longitude) / 2;
  const latDelta = Math.max(Math.abs(pickup.latitude - drop.latitude) * 1.4, 0.005);
  const lngDelta = Math.max(Math.abs(pickup.longitude - drop.longitude) * 1.4, 0.005);

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: midLat,
          longitude: midLng,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <Marker coordinate={pickup} pinColor={colors.primary} />
        <Marker coordinate={drop} pinColor={colors.dark} />
        {hasRoute ? (
          <Polyline
            coordinates={coords}
            strokeColor={colors.primary}
            strokeWidth={4}
          />
        ) : (
          <Polyline
            coordinates={[pickup, drop]}
            strokeColor={colors.muted}
            strokeWidth={2}
            lineDashPattern={[8, 6]}
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 200,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  map: { flex: 1 },
});
