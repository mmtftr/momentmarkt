/**
 * TODO(#137): "Why am I seeing this?" affordance — long-press on a
 * swipe card should reveal the matched signals + the lens that picked
 * it (DESIGN_PRINCIPLES.md #5: reasoning is inspectable). For the
 * lens-as-primary-surface ship we accept that the chip in the row IS
 * a lightweight version of this (the user can see which strategy is
 * curating). Full long-press transparency view is a follow-up.
 */

/**
 * SwipeOfferStack — 3-card swipeable variant stack (issue #132).
 *
 * Renders a stack of `AlternativeOffer` cards (cheapest → most generous,
 * top of stack first). The user swipes RIGHT to settle on a variant
 * ("I want this") or LEFT to advance to the next card ("show me another").
 * After every card is left-swiped we fall through to `onAllPassed` which
 * App.tsx wires to dismiss back to the silent wallet.
 *
 * Mechanic story: dwell time per card + swipe direction is the on-device
 * preference signal — the user reveals their reservation price by swiping
 * right on the smallest acceptable variant. For the demo the dwell ms is
 * console.logged only; a real on-device preference model is post-hackathon.
 *
 * Visual:
 *   - Top card is interactive (pan gesture). The card behind peeks at
 *     scale 0.95, translateY +12 so the stack reads as a *stack*, not as
 *     a single card.
 *   - Each card is a `WidgetRenderer` rendering its `widget_spec`.
 *   - A bright spark-tinted discount pill chip floats in the top-right
 *     corner so the user can see the discount escalating across swipes
 *     (−10% → −15% → −20% in the default 3-variant ladder).
 *
 * Physics:
 *   - Swipe right when translationX > THRESHOLD_X *or* velocityX > THRESHOLD_VX.
 *   - Swipe left mirrors with negated thresholds.
 *   - Weak pans spring back to center with a 220ms ease-out.
 *
 * Inline styles vs token utilities: the styles helper silently drops any
 * token not in its allow-list. Layout primitives this component needs
 * (absolute insets, dynamic minHeight, transform/opacity) aren't tokenized,
 * so we inline them. Color + typography stays in the token vocabulary so
 * the wallet palette stays consistent.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import type { AlternativeOffer } from "../lib/api";
import { lightTap, mediumTap } from "../lib/haptics";
import { s } from "../styles";
import { WidgetRenderer } from "./WidgetRenderer";

const THRESHOLD_X = 100;
const THRESHOLD_VX = 600;
const SWIPE_OUT_DURATION = 240;
const SPRING_BACK_DURATION = 220;
const STACK_MIN_HEIGHT = 460;

export type DwellByVariant = Record<string, number>;

type Props = {
  variants: AlternativeOffer[];
  /** Fired when the user swipes RIGHT on a card. */
  onSettle: (variant: AlternativeOffer, dwellMsByVariant: DwellByVariant) => void;
  /** Fired when every card has been swiped LEFT. */
  onAllPassed: (dwellMsByVariant: DwellByVariant) => void;
};

export function SwipeOfferStack({ variants, onSettle, onAllPassed }: Props) {
  const { width } = useWindowDimensions();
  // Index of the top-of-stack card. Bumping advances to the next variant.
  const [index, setIndex] = useState(0);
  // Per-variant accumulated dwell ms (mount → swipe). Lives in a ref so the
  // tally survives re-renders triggered by index changes.
  const dwellRef = useRef<DwellByVariant>({});
  // mountedAt tracking is per-card-position so we can compute dwell on swipe.
  const mountedAtRef = useRef<number>(Date.now());

  // Reset the mount clock every time a new top card appears.
  useEffect(() => {
    mountedAtRef.current = Date.now();
  }, [index]);

  const recordDwell = useCallback((variantId: string) => {
    const elapsed = Date.now() - mountedAtRef.current;
    dwellRef.current = {
      ...dwellRef.current,
      [variantId]: (dwellRef.current[variantId] ?? 0) + elapsed,
    };
  }, []);

  const handleRight = useCallback(
    (variant: AlternativeOffer) => {
      recordDwell(variant.variant_id);
      lightTap();
      // eslint-disable-next-line no-console
      console.log("settled", variant.variant_id, dwellRef.current);
      onSettle(variant, { ...dwellRef.current });
    },
    [onSettle, recordDwell],
  );

  const handleLeft = useCallback(
    (variant: AlternativeOffer) => {
      recordDwell(variant.variant_id);
      const next = index + 1;
      if (next >= variants.length) {
        // eslint-disable-next-line no-console
        console.log("all passed", dwellRef.current);
        onAllPassed({ ...dwellRef.current });
        return;
      }
      setIndex(next);
    },
    [index, variants.length, onAllPassed, recordDwell],
  );

  if (variants.length === 0) return null;

  // Render up to 2 cards: top (interactive) + peek behind. Anything beyond
  // is invisible to the user and would just bloat the layout.
  const top = variants[index];
  const peek = variants[index + 1];

  return (
    <View style={{ width: "100%" }}>
      {/* Discount progress chip + "swipe to choose" hint sit ABOVE the stack
          so they don't fight the cards for taps. */}
      <View style={[...s("flex-row items-center justify-between"), { marginBottom: 12 }]}>
        <Text style={s("text-[11px] font-bold uppercase tracking-[2px] text-cocoa")}>
          {`Card ${index + 1} of ${variants.length}`}
        </Text>
        <Text style={s("text-[11px] font-semibold text-neutral-600")}>
          ← skip · keep →
        </Text>
      </View>

      <View style={{ width: "100%", minHeight: STACK_MIN_HEIGHT, position: "relative" }}>
        {peek ? <PeekCard key={`peek-${peek.variant_id}`} variant={peek} /> : null}
        {top ? (
          <SwipeCard
            key={`top-${top.variant_id}-${index}`}
            variant={top}
            screenWidth={width}
            onSwipeRight={() => handleRight(top)}
            onSwipeLeft={() => handleLeft(top)}
          />
        ) : null}
      </View>
    </View>
  );
}

/**
 * The stack card behind the top card. Static (no gesture), peek-only.
 * Scaled down + nudged so the user sees the *next* card waiting.
 */
function PeekCard({ variant }: { variant: AlternativeOffer }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        transform: [{ scale: 0.95 }, { translateY: 12 }],
        opacity: 0.55,
      }}
    >
      <CardSurface variant={variant} interactive={false} />
    </View>
  );
}

/**
 * The interactive top-of-stack card. Owns the pan gesture + animation. On
 * release we either fling off-screen (commit the swipe direction) or spring
 * back to center (weak pan).
 */
function SwipeCard({
  variant,
  screenWidth,
  onSwipeRight,
  onSwipeLeft,
}: {
  variant: AlternativeOffer;
  screenWidth: number;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const flingOff = useCallback(
    (dir: "left" | "right") => {
      const target = dir === "right" ? screenWidth + 200 : -screenWidth - 200;
      translateX.value = withTiming(target, {
        duration: SWIPE_OUT_DURATION,
        easing: Easing.out(Easing.exp),
      });
      mediumTap();
      if (dir === "right") onSwipeRight();
      else onSwipeLeft();
    },
    [onSwipeLeft, onSwipeRight, screenWidth, translateX],
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-10, 10])
        .onChange((e) => {
          translateX.value = e.translationX;
          // Slight vertical follow so the card feels picked-up, not ratcheted.
          translateY.value = e.translationY * 0.15;
        })
        .onEnd((e) => {
          const goRight =
            e.translationX > THRESHOLD_X || e.velocityX > THRESHOLD_VX;
          const goLeft =
            e.translationX < -THRESHOLD_X || e.velocityX < -THRESHOLD_VX;
          if (goRight) {
            runOnJS(flingOff)("right");
          } else if (goLeft) {
            runOnJS(flingOff)("left");
          } else {
            translateX.value = withTiming(0, {
              duration: SPRING_BACK_DURATION,
              easing: Easing.out(Easing.exp),
            });
            translateY.value = withTiming(0, {
              duration: SPRING_BACK_DURATION,
              easing: Easing.out(Easing.exp),
            });
          }
        }),
    [flingOff, translateX, translateY],
  );

  const cardStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-screenWidth, 0, screenWidth],
      [-12, 0, 12],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotation}deg` },
      ],
    };
  });

  // Accept (right swipe) overlay — fades in as user pans right.
  const acceptStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, THRESHOLD_X],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));
  // Skip (left swipe) overlay — fades in as user pans left.
  const skipStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-THRESHOLD_X, 0],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          { position: "absolute", left: 0, right: 0, top: 0 },
          cardStyle,
        ]}
      >
        <CardSurface variant={variant} interactive />
        {/* Accept / skip overlays — corner badges so the swipe direction is
            unambiguous as the user pans. */}
        <Animated.View
          pointerEvents="none"
          style={[
            ...s("rounded-full bg-spark px-3 py-2"),
            { position: "absolute", top: 24, left: 24 },
            acceptStyle,
          ]}
        >
          <Text style={s("text-xs font-black uppercase tracking-[2px] text-white")}>
            ✓ Keep
          </Text>
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[
            ...s("rounded-full bg-cocoa px-3 py-2"),
            { position: "absolute", top: 24, right: 24 },
            skipStyle,
          ]}
        >
          <Text style={s("text-xs font-black uppercase tracking-[2px] text-white")}>
            ✗ Skip
          </Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

/**
 * Static card body — the validated GenUI widget plus a discount chip in the
 * corner so the escalation reads visually. Used by both the interactive top
 * card and the static peek behind it.
 */
function CardSurface({
  variant,
  interactive,
}: {
  variant: AlternativeOffer;
  interactive: boolean;
}) {
  return (
    <View style={{ width: "100%" }}>
      {/* Discount pill chip — top-right corner so it doesn't fight the
          GenUI hero image's own top-left rain badge. */}
      <View
        pointerEvents="none"
        style={[
          ...s("rounded-full bg-spark px-3 py-2"),
          { position: "absolute", top: 12, right: 12, zIndex: 5 },
        ]}
      >
        <Text style={s("text-xs font-black uppercase tracking-[2px] text-white")}>
          {variant.discount_label}
        </Text>
      </View>
      {/* The GenUI widget itself. enterAnimation=false because the swipe
          stack already animates entry/exit at the card level — letting the
          renderer animate would double-bounce on every advance. */}
      <View
        style={{
          width: "100%",
          minHeight: 420,
          opacity: interactive ? 1 : 0.92,
        }}
      >
        <WidgetRenderer
          node={variant.widget_spec}
          // The inline CTA tap is intentionally a no-op while inside the
          // swipe stack — the canonical commit is the right-swipe gesture
          // so the dwell signal stays clean. Once App.tsx routes the
          // settled variant into the focused offer view, the renderer's
          // onRedeem there points at the real redeem flow.
          onRedeem={() => undefined}
          enterAnimation={false}
        />
      </View>
    </View>
  );
}
