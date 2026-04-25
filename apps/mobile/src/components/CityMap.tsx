import type { JSX } from "react";
import { useEffect } from "react";
import {
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { s } from "../styles";

export type MerchantCategory =
  | "cafe"
  | "bakery"
  | "bookstore"
  | "fitness"
  | "kiosk"
  | "supermarket"
  | "default";

export type CityMapPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  highlighted?: boolean;
  /**
   * Merchant category — drives the marker glyph. Defaults to a generic
   * pin when missing so the component never blows up on legacy data.
   */
  category?: MerchantCategory;
};

type Props = {
  centerLat: number;
  centerLng: number;
  pins?: CityMapPin[];
  width?: number;
  height?: number;
  interactive?: boolean;
  showCompass?: boolean;
  /**
   * Optional style override applied to the outer wrapper View. Lets the
   * caller make the map full-bleed (`StyleSheet.absoluteFill`) or pin it
   * inside another container without inheriting the default rounded card
   * sizing. When provided it replaces the default rounded-2xl + width/height
   * styling.
   */
  style?: StyleProp<ViewStyle>;
};

// Inline brand color (styles.ts does not export the palette).
// Mirrors `colors.spark` so the highlighted pin reads as MomentMarkt-red.
const SPARK_RED = "#f2542d";

// Category → emoji glyph used inside the marker bubble. Keep this list in
// sync with `MerchantCategory`. Anything missing falls back to the
// generic pin so a future category never crashes the marker view.
const CATEGORY_GLYPH: Record<MerchantCategory, string> = {
  cafe: "☕",
  bakery: "🥨",
  bookstore: "📚",
  fitness: "🏃",
  kiosk: "📰",
  supermarket: "🛒",
  default: "📍",
};

// Berlin Mitte fallback pin set: one highlighted Cafe Bondi plus a few
// muted partner pins so the map has a visible city texture even when the
// caller forgets to pass `pins`. Coords are rounded plausibles around
// the Mitte center (52.5219, 13.4132).
const DEFAULT_BERLIN_PINS: CityMapPin[] = [
  {
    id: "cafe-bondi",
    name: "Cafe Bondi",
    lat: 52.521,
    lng: 13.413,
    highlighted: true,
    category: "cafe",
  },
  { id: "backerei-mitte", name: "Backerei Mitte", lat: 52.5225, lng: 13.4108, category: "bakery" },
  { id: "buchladen-rosa", name: "Buchladen Rosa", lat: 52.5198, lng: 13.4155, category: "bookstore" },
  { id: "kiosk-ecke", name: "Kiosk Ecke", lat: 52.5232, lng: 13.4147, category: "kiosk" },
  { id: "eisdiele-spree", name: "Eisdiele Spree", lat: 52.5202, lng: 13.4118, category: "default" },
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
  style,
}: Props): JSX.Element {
  const resolvedPins = pins ?? DEFAULT_BERLIN_PINS;

  // ~1km bbox around the center.
  const region = {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: 0.01,
    longitudeDelta: 0.015,
  };

  const wrapperStyle: StyleProp<ViewStyle> = style
    ? [{ overflow: "hidden" }, style]
    : [
        ...s("rounded-2xl shadow-sm"),
        {
          width,
          height,
          overflow: "hidden",
        },
      ];

  return (
    <View style={wrapperStyle}>
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
          <MerchantMarker key={pin.id} pin={pin} />
        ))}
      </MapView>
    </View>
  );
}

/**
 * Branded merchant marker — replaces the generic red MapKit pin with a
 * white circle holding the merchant's category glyph. Highlighted pins
 * (e.g. Cafe Bondi) get a larger spark-red bubble plus the pulsing halo
 * preserved from #31 so they read as the wallet's hero suggestion.
 *
 * Pattern aligns with Apple Maps + Yelp-style category chips: small
 * round bubbles + emoji are immediately scannable on top of street
 * tiles, while the halo + color shift directs the eye to the offer.
 */
function MerchantMarker({ pin }: { pin: CityMapPin }): JSX.Element {
  const isHighlighted = Boolean(pin.highlighted);
  const glyph = CATEGORY_GLYPH[pin.category ?? "default"] ?? CATEGORY_GLYPH.default;

  return (
    <Marker
      coordinate={{ latitude: pin.lat, longitude: pin.lng }}
      title={pin.name}
      anchor={{ x: 0.5, y: 0.5 }}
      // Halo animation requires React-side redraws — let the highlighted
      // marker view track changes so the pulse animates. Static markers
      // skip this for perf.
      tracksViewChanges={isHighlighted}
      opacity={isHighlighted ? 1 : 0.92}
    >
      {isHighlighted ? (
        <HighlightedMerchantMarker glyph={glyph} />
      ) : (
        <View style={markerStyles.bubbleWrap}>
          <View style={markerStyles.normal}>
            <Text style={markerStyles.normalGlyph}>{glyph}</Text>
          </View>
        </View>
      )}
    </Marker>
  );
}

/**
 * Highlighted variant: spark-red circle + white border + pulsing halo
 * (scale 1 → 1.5, opacity 0.7 → 0) on a 1.2s ease-in-out loop. This is
 * the #31 motion preserved verbatim, just wrapped around the new
 * branded bubble instead of the bare dot.
 */
function HighlightedMerchantMarker({ glyph }: { glyph: string }): JSX.Element {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const haloStyle = useAnimatedStyle(() => {
    const scale = 1 + pulse.value * 0.5; // 1 → 1.5
    const opacity = 0.7 - pulse.value * 0.7; // 0.7 → 0
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <View style={markerStyles.highlightedWrap}>
      <Animated.View
        pointerEvents="none"
        style={[markerStyles.halo, haloStyle]}
      />
      <View style={markerStyles.highlighted}>
        <Text style={markerStyles.highlightedGlyph}>{glyph}</Text>
      </View>
    </View>
  );
}

// Marker chrome lives in StyleSheet (not the `s()` helper) because the
// shadow + border tokens here aren't in the Tailwind-ish palette and
// the values are static. Per CityMap convention, only the outer wrapper
// uses `s()` — marker internals stay co-located for readability.
const markerStyles = StyleSheet.create({
  bubbleWrap: {
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    width: 40,
  },
  normal: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 0.5,
    borderColor: "#17120f",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1.5 },
    elevation: 2,
  },
  normalGlyph: {
    fontSize: 14,
    lineHeight: 16,
  },
  highlightedWrap: {
    alignItems: "center",
    justifyContent: "center",
    height: 64,
    width: 64,
  },
  halo: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: SPARK_RED,
  },
  highlighted: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: SPARK_RED,
    borderWidth: 2,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  highlightedGlyph: {
    fontSize: 20,
    lineHeight: 22,
  },
});
