import { type ReactElement, useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { s } from "../styles";

type Props = {
  /** Persona greeting context — kept as a prop so the demo cut can swap personas. */
  personaName?: string;
  /** Location label rendered inside the weather widget. */
  cityLabel?: string;
  /** Current temperature (°C) shown as the big number in the weather widget. */
  tempC?: number;
  /** Short condition label, e.g. "overcast • rain in ~22 min". */
  weatherLabel?: string;
};

/**
 * Full-screen iOS-style lock screen used as the silent opening state of the
 * MomentMarkt demo (see SPEC §The demo — "calm and silent as Mia walks").
 *
 * Pure presentational component: no API calls, no navigation, no global state.
 * The only side effects are a 60s interval to keep the wall-clock fresh and a
 * Reanimated v4 loop driving the weather chip + alive-dot pulses.
 */
export function LockScreen({
  personaName: _personaName = "Mia",
  cityLabel = "Berlin Mitte",
  tempC = 11,
  weatherLabel = "overcast • rain in ~22 min",
}: Props): ReactElement {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Re-align to the next minute boundary so HH:mm flips when the wall clock does.
    const start = new Date();
    const msUntilNextMinute =
      (60 - start.getSeconds()) * 1000 - start.getMilliseconds();
    let interval: ReturnType<typeof setInterval> | undefined;
    const align = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 60_000);
    }, Math.max(250, msUntilNextMinute));
    return () => {
      clearTimeout(align);
      if (interval) clearInterval(interval);
    };
  }, []);

  const pulse = useSharedValue(0);
  const dot = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    dot.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [dot, pulse]);

  const chipStyle = useAnimatedStyle(() => ({
    opacity: 0.7 + pulse.value * 0.3,
    transform: [{ scale: 0.97 + pulse.value * 0.06 }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + dot.value * 0.55,
  }));

  const time = formatTimeDe(now);
  const date = formatDateDe(now);

  return (
    <View style={s("flex-1 bg-ink")}>
      <SafeAreaView style={s("flex-1")} edges={["top", "left", "right", "bottom"]}>
        <View style={s("flex-1 px-5 py-6 justify-between")}>
          {/* Eyebrow — tiny brand stamp, very subtle */}
          <View>
            <Text
              style={s(
                "text-[11px] font-semibold uppercase tracking-[3px] text-white/30",
              )}
            >
              MomentMarkt
            </Text>
          </View>

          {/* Time + date block, top-third */}
          <View style={s("items-center")}>
            <Text
              style={[
                ...s("text-[96px] font-extralight text-white text-center"),
                { lineHeight: 104, letterSpacing: -2 },
              ]}
            >
              {time}
            </Text>
            <Text
              style={s(
                "mt-2 text-base font-semibold text-cream/60 text-center",
              )}
            >
              {date}
            </Text>
          </View>

          {/* Spacer keeps the weather widget anchored toward the bottom-third */}
          <View />

          {/* Weather widget — frosted card */}
          <View style={s("rounded-[22px] bg-white/15 p-5")}>
            <View style={s("flex-row items-center justify-between")}>
              <View style={s("flex-row items-center gap-2")}>
                <Text style={s("text-base text-white/70")}>◉</Text>
                <Text
                  style={s(
                    "text-xs font-semibold uppercase tracking-[2px] text-white/70",
                  )}
                >
                  {cityLabel}
                </Text>
              </View>
              <Text style={s("text-xs font-semibold text-white/50")}>Weather</Text>
            </View>

            <View style={s("mt-4 flex-row items-center justify-between")}>
              <Text
                style={[
                  ...s("text-[40px] font-light text-white"),
                  { lineHeight: 44 },
                ]}
              >
                {Math.round(tempC)}°
              </Text>
              <Text style={s("text-2xl text-white/80")}>☁</Text>
            </View>

            <Text style={s("mt-2 text-sm font-semibold text-white/70")}>
              {weatherLabel}
            </Text>

            <Animated.View
              style={[
                chipStyle,
                ...s("mt-4 rounded-full bg-white/20 px-3 py-2"),
                { alignSelf: "flex-start" },
              ]}
            >
              <Text
                style={s(
                  "text-[11px] font-bold uppercase tracking-[2px] text-white",
                )}
              >
                Rain in ~22 min
              </Text>
            </Animated.View>
          </View>

          {/* Alive-dot bottom-center */}
          <View style={s("items-center")}>
            <Animated.View
              style={[dotStyle, ...s("h-1 w-1 rounded-full bg-white/40")]}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

/** German `HH:mm` (24h, zero-padded). */
function formatTimeDe(d: Date): string {
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

/** German lock-screen date row, e.g. "Samstag, 25. April". */
function formatDateDe(d: Date): string {
  const weekday = WEEKDAYS_DE[d.getDay()];
  const day = d.getDate();
  const month = MONTHS_DE[d.getMonth()];
  return `${weekday}, ${day}. ${month}`;
}

const WEEKDAYS_DE = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
] as const;

const MONTHS_DE = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
] as const;
