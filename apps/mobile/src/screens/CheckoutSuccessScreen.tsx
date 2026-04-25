import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { s } from "../styles";

type Props = {
  cashbackEur: number;
  /** Optional merchant counter / budget remaining for the dev-panel feel. */
  budgetRemaining?: number;
  onDone: () => void;
};

/**
 * Standalone full-screen "cashback gutgeschrieben" success view.
 * Plays a coordinated checkmark scale + headline fade + confetti
 * shimmer to make the simulated checkout feel like a real reward
 * moment in the demo cut.
 */
export function CheckoutSuccessScreen({ cashbackEur, budgetRemaining, onDone }: Props) {
  const checkScale = useSharedValue(0);
  const headlineOpacity = useSharedValue(0);
  const headlineTranslate = useSharedValue(12);
  const sparkle = useSharedValue(0);

  useEffect(() => {
    checkScale.value = withSequence(
      withTiming(1.15, { duration: 320, easing: Easing.out(Easing.exp) }),
      withTiming(1, { duration: 220, easing: Easing.inOut(Easing.quad) }),
    );
    headlineOpacity.value = withDelay(
      220,
      withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }),
    );
    headlineTranslate.value = withDelay(
      220,
      withTiming(0, { duration: 360, easing: Easing.out(Easing.cubic) }),
    );
    sparkle.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [checkScale, headlineOpacity, headlineTranslate, sparkle]);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const headlineStyle = useAnimatedStyle(() => ({
    opacity: headlineOpacity.value,
    transform: [{ translateY: headlineTranslate.value }],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + sparkle.value * 0.6,
    transform: [{ scale: 0.95 + sparkle.value * 0.1 }],
  }));

  return (
    <View style={s("flex-1 bg-spark px-5 py-6")}>
      <View style={s("flex-1 items-center justify-center")}>
        <Animated.View
          style={[sparkleStyle, ...s("absolute h-72 w-72 rounded-full bg-white/15")]}
        />
        <Animated.View
          style={[checkStyle, ...s("h-32 w-32 items-center justify-center rounded-full bg-white")]}
        >
          <Text style={s("text-5xl font-black text-spark")}>✓</Text>
        </Animated.View>

        <Animated.View style={[headlineStyle, ...s("mt-8 items-center px-2")]}> 
          <Text style={s("text-center text-xs font-bold uppercase tracking-[3px] text-white/80")}>
            Cashback gutgeschrieben
          </Text>
          <Text style={s("mt-3 text-center text-4xl font-black leading-[44px] text-white")}>
            +€{cashbackEur.toFixed(2)}
          </Text>
          <Text style={s("mt-2 text-center text-sm font-semibold text-white/80")}>
            via girocard simulation
          </Text>
          {typeof budgetRemaining === "number" ? (
            <View style={s("mt-5 rounded-full bg-white/15 px-4 py-2")}>
              <Text style={s("text-xs font-bold uppercase tracking-[2px] text-white")}>
                Merchant budget remaining: €{budgetRemaining.toFixed(2)}
              </Text>
            </View>
          ) : null}
        </Animated.View>
      </View>

      <Pressable
        accessibilityRole="button"
        style={s("rounded-2xl bg-white px-5 py-4")}
        onPress={onDone}
      >
        <Text style={s("text-center text-base font-black text-spark")}>Done</Text>
      </Pressable>
    </View>
  );
}
