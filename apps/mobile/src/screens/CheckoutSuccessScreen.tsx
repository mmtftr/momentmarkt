import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { s } from "../styles";

type Props = {
  cashbackEur: number;
  /** Optional merchant counter / budget remaining for the dev-panel feel. */
  budgetRemaining?: number;
  onDone: () => void;
};

/** Confetti palette pulled from styles.ts tokens. */
const CONFETTI_COLORS = ["#6f3f2c", "#f2542d", "#356f95", "#fff8ee"]; // cocoa, spark, rain, cream
const CONFETTI_COUNT = 12;

type ConfettiSpec = {
  /** Starting horizontal offset in px from the centre line. */
  startX: number;
  /** Final horizontal offset in px from the centre line. */
  endX: number;
  /** Final vertical drop in px below the start. */
  fallY: number;
  /** Total rotation in degrees. */
  rotateTo: number;
  /** Color from the palette. */
  color: string;
  /** Tile size. */
  size: number;
  /** Square (0) or circle (1) shape pick. */
  shape: 0 | 1;
};

/** Deterministic-ish per-particle config so each render plays the same dance. */
function buildConfettiSpecs(count: number): ConfettiSpec[] {
  const specs: ConfettiSpec[] = [];
  for (let i = 0; i < count; i += 1) {
    // Pseudo-random but stable per index so the demo cut looks identical each take.
    const angle = (i / count) * Math.PI * 2;
    const startX = Math.cos(angle) * 30;
    const endX = Math.cos(angle) * (90 + (i % 3) * 25);
    const fallY = 220 + (i % 4) * 30;
    const rotateTo = (i % 2 === 0 ? 1 : -1) * (180 + (i * 27) % 240);
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const size = 8 + (i % 3) * 2;
    const shape: 0 | 1 = i % 2 === 0 ? 0 : 1;
    specs.push({ startX, endX, fallY, rotateTo, color, size, shape });
  }
  return specs;
}

function ConfettiParticle({ spec, index }: { spec: ConfettiSpec; index: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * 50,
      withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) }),
    );
  }, [progress, index]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    // Fade in fast, hold, then fade out near the end of the fall.
    const opacity = p < 0.1 ? p * 10 : p > 0.85 ? Math.max(0, 1 - (p - 0.85) * 6.6) : 1;
    const translateX = spec.startX + (spec.endX - spec.startX) * p;
    const translateY = -40 + spec.fallY * p;
    const rotate = `${spec.rotateTo * p}deg`;
    return {
      opacity,
      transform: [{ translateX }, { translateY }, { rotate }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        animatedStyle,
        {
          position: "absolute",
          width: spec.size,
          height: spec.size,
          backgroundColor: spec.color,
          borderRadius: spec.shape === 1 ? spec.size / 2 : 2,
        },
      ]}
    />
  );
}

/**
 * Standalone full-screen "cashback gutgeschrieben" success view.
 *
 * Plays a coordinated 3-second beat for the demo cut:
 *  - inkflavoured circle pops in with an SVG checkmark on an elastic curve
 *  - 12 confetti particles drift down in a staggered, deterministic arc
 *  - cashback amount counts up from +€0.00 to the real value over 800ms
 *  - sub-line and Done button fade in on a delay so the eye lands in order
 *  - optional Haptics success notification fires if expo-haptics is present
 */
export function CheckoutSuccessScreen({ cashbackEur, budgetRemaining, onDone }: Props) {
  const checkScale = useSharedValue(0.5);
  const checkOpacity = useSharedValue(0);
  const subLineOpacity = useSharedValue(0);
  const doneOpacity = useSharedValue(0);
  const doneTranslate = useSharedValue(16);

  const confettiSpecs = useMemo(() => buildConfettiSpecs(CONFETTI_COUNT), []);

  // Count-up via rAF + setState. Simple and demo-stable.
  const [displayedAmount, setDisplayedAmount] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Hero check: scale 0.5 -> 1.2 -> 1.0 with elastic, fade in opacity.
    checkScale.value = withTiming(1.2, {
      duration: 360,
      easing: Easing.out(Easing.cubic),
    });
    checkScale.value = withDelay(
      360,
      withTiming(1, { duration: 240, easing: Easing.elastic(1.2) }),
    );
    checkOpacity.value = withTiming(1, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });

    // Sub-line fades in 300ms after the checkmark settles (~600ms total).
    subLineOpacity.value = withDelay(
      900,
      withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }),
    );

    // Done button fades in 1.5s after mount.
    doneOpacity.value = withDelay(
      1500,
      withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }),
    );
    doneTranslate.value = withDelay(
      1500,
      withTiming(0, { duration: 360, easing: Easing.out(Easing.cubic) }),
    );

    // Cashback count-up: 0 -> cashbackEur over 800ms, kicks off after the bounce.
    const startDelayMs = 600;
    const durationMs = 800;
    const startTimeoutId = setTimeout(() => {
      const startedAt = Date.now();
      const tick = () => {
        const elapsed = Date.now() - startedAt;
        const t = Math.min(1, elapsed / durationMs);
        // easeOutCubic for a snappy stop on the final value.
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplayedAmount(cashbackEur * eased);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setDisplayedAmount(cashbackEur);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    }, startDelayMs);

    // Optional haptic — fail silent if expo-haptics is not installed in the demo build.
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Haptics = require("expo-haptics");
      if (Haptics?.notificationAsync && Haptics?.NotificationFeedbackType?.Success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
          // Swallow — haptics are best-effort.
        });
      }
    } catch {
      // expo-haptics not installed in this build; skip silently.
    }

    return () => {
      clearTimeout(startTimeoutId);
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [cashbackEur, checkScale, checkOpacity, subLineOpacity, doneOpacity, doneTranslate]);

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  const subLineStyle = useAnimatedStyle(() => ({
    opacity: subLineOpacity.value,
  }));

  const doneStyle = useAnimatedStyle(() => ({
    opacity: doneOpacity.value,
    transform: [{ translateY: doneTranslate.value }],
  }));

  return (
    <View style={s("flex-1 bg-spark px-5 py-6")}>
      <View style={s("flex-1 items-center justify-center")}>
        {/* Confetti layer — sits behind the hero, anchored at centre. */}
        <View
          pointerEvents="none"
          style={s("absolute h-72 w-72 items-center justify-center")}
        >
          {confettiSpecs.map((spec, i) => (
            <ConfettiParticle key={i} spec={spec} index={i} />
          ))}
        </View>

        {/* Hero checkmark: ink circle with white SVG check. */}
        <Animated.View
          style={[
            checkStyle,
            ...s("h-32 w-32 items-center justify-center rounded-full bg-ink"),
          ]}
        >
          <Svg width={64} height={64} viewBox="0 0 24 24">
            <Path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="#fff8ee"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </Animated.View>

        <View style={s("mt-8 items-center px-2")}>
          <Text style={s("text-center text-xs font-bold uppercase tracking-[3px] text-white/80")}>
            Cashback gutgeschrieben
          </Text>
          <Text style={s("mt-3 text-center text-5xl font-black leading-[44px] text-white")}>
            +€{displayedAmount.toFixed(2)}
          </Text>
          <Animated.View style={subLineStyle}>
            <Text style={s("mt-2 text-center text-sm font-semibold text-white/80")}>
              via girocard simulation
            </Text>
          </Animated.View>
          {typeof budgetRemaining === "number" ? (
            <Animated.View
              style={[subLineStyle, ...s("mt-5 rounded-full bg-white/15 px-4 py-2")]}
            >
              <Text style={s("text-xs font-bold uppercase tracking-[2px] text-white")}>
                Merchant budget remaining: €{budgetRemaining.toFixed(2)}
              </Text>
            </Animated.View>
          ) : null}
        </View>
      </View>

      <Animated.View style={doneStyle}>
        <Pressable
          accessibilityRole="button"
          style={s("rounded-2xl bg-ink px-5 py-4")}
          onPress={onDone}
        >
          <Text style={s("text-center text-base font-black text-cream")}>Fertig</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
