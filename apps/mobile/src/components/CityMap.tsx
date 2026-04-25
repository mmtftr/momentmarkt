import type { JSX } from "react";
import { View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

import { s } from "../styles";

export type CityMapPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  highlighted?: boolean;
};

type Props = {
  centerLat: number;
  centerLng: number;
  pins?: CityMapPin[];
  width?: number;
  height?: number;
  interactive?: boolean;
  showCompass?: boolean;
};

// Inline brand color (styles.ts does not export the palette).
// Mirrors `colors.spark` so the highlighted pin reads as MomentMarkt-red.
const SPARK_RED = "#f2542d";

// Berlin Mitte fallback pin set: one highlighted Cafe Bondi plus a few
// muted partner pins so the map has a visible city texture even when the
// caller forgets to pass `pins`. Coords are rounded plausibles around
// the Mitte center (52.5219, 13.4132).
const DEFAULT_BERLIN_PINS: CityMapPin[] = [
  { id: "cafe-bondi", name: "Cafe Bondi", lat: 52.521, lng: 13.413, highlighted: true },
  { id: "backerei-mitte", name: "Backerei Mitte", lat: 52.5225, lng: 13.4108 },
  { id: "buchladen-rosa", name: "Buchladen Rosa", lat: 52.5198, lng: 13.4155 },
  { id: "kiosk-ecke", name: "Kiosk Ecke", lat: 52.5232, lng: 13.4147 },
  { id: "eisdiele-spree", name: "Eisdiele Spree", lat: 52.5202, lng: 13.4118 },
];

/**
 * Native Apple Maps fragment for the demo's city framing (Berlin Mitte
 * by default, Zurich HB via the city-config swap). Pure presentational,
 * props-driven — no API calls, no global state.
 *
 * Uses `PROVIDER_DEFAULT` so iOS gets Apple Maps (no API key, no Google
 * fees). Will not render in Expo Go because `react-native-maps` is a
 * native module; needs the dev client (#21) to come up live. The
 * component still typechecks and ships the contract.
 */
export function CityMap({
  centerLat,
  centerLng,
  pins,
  width = 320,
  height = 200,
  interactive = false,
  showCompass = false,
}: Props): JSX.Element {
  const resolvedPins = pins ?? DEFAULT_BERLIN_PINS;

  // ~1km bbox around the center.
  const region = {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: 0.01,
    longitudeDelta: 0.015,
  };

  return (
    <View
      style={[
        ...s("rounded-2xl shadow-sm"),
        {
          width,
          height,
          overflow: "hidden",
        },
      ]}
    >
      <MapView
        provider={PROVIDER_DEFAULT}
        style={{ width: "100%", height: "100%" }}
        initialRegion={region}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={interactive}
        pitchEnabled={interactive}
        showsCompass={showCompass}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {resolvedPins.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.lat, longitude: pin.lng }}
            title={pin.name}
            pinColor={pin.highlighted ? SPARK_RED : undefined}
            opacity={pin.highlighted ? 1 : 0.55}
            tracksViewChanges={false}
          />
        ))}
      </MapView>
    </View>
  );
}
