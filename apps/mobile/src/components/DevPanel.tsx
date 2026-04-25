import { useCallback, useState, type ReactElement } from "react";
import { Pressable, Switch, Text, View } from "react-native";

import { s } from "../styles";

/**
 * DevPanel (issue #25) — engineering-signals sidecar.
 *
 * SPEC §The demo: "A dev panel beside the phone logs the surfacing input
 * as {intent_token, h3_cell_r8}, making the privacy boundary visible."
 *
 * Pure presentational; all data comes in via props. The parent (App.tsx,
 * wired in via #29) owns the surfacing computation and toggle state.
 *
 * Visual language: GitHub-dark, OpenAI-dev-panel aesthetic — narrow 260px
 * sidecar, monospace tokens, subtle bars, low-saturation chrome. Designed
 * to read as "engineering surface next to the consumer phone" in the
 * 1-min tech-video cut.
 */

export type DevPanelSignalTone = "neutral" | "warning" | "good";

export type DevPanelSignal = {
  label: string;
  value: string;
  tone?: DevPanelSignalTone;
};

export type DevPanelScoreBreakdown = {
  weather: number;
  event: number;
  demand: number;
  proximity: number;
  highIntent: number;
};

export type DevPanelCity = "berlin" | "zurich";

type Props = {
  /** When false, render nothing (consumer phone gets full width). */
  visible?: boolean;
  /** Composite engine state, e.g. "rain_incoming · demand_gap · in_market". */
  compositeState: string;
  /** 2–4 chip-shaped signals (weather, event, demand, proximity, …). */
  signals: DevPanelSignal[];
  /** Surfacing score from `scoreSurfacing()`. */
  score: number;
  /** Active surfacing threshold (0.72 silent / 0.58 high-intent). */
  threshold: number;
  /** Per-feature contributions for the small bar chart. */
  breakdown: DevPanelScoreBreakdown;
  /** Hand-coded enum from `extract_intent_token()` stub. */
  intentToken: string;
  /** Coarse H3 r8 cell — the only location surfacing ever sees. */
  h3Cell: string;
  highIntent: boolean;
  onToggleHighIntent: () => void;
  city: DevPanelCity;
  onSwapCity: () => void;
  onRunSurfacing: () => void;
};

export function DevPanel(props: Props): ReactElement | null {
  const {
    visible = true,
    compositeState,
    signals,
    score,
    threshold,
    breakdown,
    intentToken,
    h3Cell,
    highIntent,
    onToggleHighIntent,
    city,
    onSwapCity,
    onRunSurfacing,
  } = props;

  const [privacyExpanded, setPrivacyExpanded] = useState(false);

  const togglePrivacy = useCallback(() => {
    setPrivacyExpanded((prev) => !prev);
  }, []);

  if (!visible) return null;

  const ratio = threshold > 0 ? Math.min(1, score / threshold) : 0;
  const willFire = score >= threshold;
  const fireCaption = `${score.toFixed(2)} / ${threshold.toFixed(2)} — ${willFire ? "will fire" : "silent"}`;

  return (
    <View
      style={[
        ...s("self-stretch w-[260px] bg-gh-bg border-l-gh"),
        { padding: 16 },
      ]}
    >
      <SectionLabel>composite_state</SectionLabel>
      <View style={s("bg-gh-chip rounded-md px-3 py-2 mb-4 border border-gh")}>
        <Text style={s("mono text-[13px] text-white")}>{compositeState}</Text>
      </View>

      <SectionLabel>signals</SectionLabel>
      <View style={s("flex-row gap-2 mb-4")}>
        {signals.map((sig) => (
          <SignalChip key={sig.label} signal={sig} />
        ))}
      </View>

      <SectionLabel>surfacing_score</SectionLabel>
      <View
        style={[
          ...s("w-full h-[6px] bg-gh-chip rounded-full overflow-hidden"),
        ]}
      >
        <View
          style={[
            { height: 6, width: `${ratio * 100}%` },
            willFire ? s("bg-gh-good") : s("bg-gh-border"),
          ]}
        />
      </View>
      <Text
        style={[
          ...s("mono text-[10px] mt-2 mb-4"),
          willFire ? s("text-gh-good") : s("text-gh-low"),
        ]}
      >
        {fireCaption}
      </Text>

      <SectionLabel>breakdown</SectionLabel>
      <View style={s("gap-1 mb-4")}>
        <BreakdownBar label="weather" value={breakdown.weather} />
        <BreakdownBar label="event" value={breakdown.event} />
        <BreakdownBar label="demand" value={breakdown.demand} />
        <BreakdownBar label="proximity" value={breakdown.proximity} />
        <BreakdownBar
          label="high_intent"
          value={breakdown.highIntent}
          accent={highIntent}
        />
      </View>

      <SectionLabel>privacy_envelope</SectionLabel>
      <Pressable
        onPress={togglePrivacy}
        style={s("bg-gh-chip rounded-md px-3 py-2 mb-4 border border-gh")}
      >
        <View style={s("flex-row items-center gap-2")}>
          <Text style={s("text-[10px]")}>{"\u{1F512}"}</Text>
          <Text style={s("mono text-[10px] text-white")} numberOfLines={1}>
            {"{intent_token, h3_cell_r8}"}
          </Text>
        </View>
        {privacyExpanded ? (
          <View style={s("mt-2 gap-1")}>
            <Text style={s("mono text-[10px] text-gh-low")}>intent_token</Text>
            <Text style={s("mono text-[10px] text-white")}>{intentToken}</Text>
            <Text style={s("mono text-[10px] text-gh-low mt-1")}>h3_cell_r8</Text>
            <Text style={s("mono text-[10px] text-white")}>{h3Cell}</Text>
          </View>
        ) : (
          <Text style={s("mono text-[10px] text-gh-low mt-1")}>tap to expand</Text>
        )}
      </Pressable>

      <SectionLabel>high_intent_boost</SectionLabel>
      <View
        style={s(
          "flex-row items-center justify-between mb-4 bg-gh-chip rounded-md px-3 py-2 border border-gh",
        )}
      >
        <View style={s("flex-1")}>
          <Text style={s("text-[11px] text-white font-semibold")}>
            Boost in-market signal
          </Text>
          <Text style={s("text-[10px] text-gh-low mt-0.5")}>
            lowers threshold + aggressive headline
          </Text>
        </View>
        <Switch
          value={highIntent}
          onValueChange={onToggleHighIntent}
          trackColor={{ false: "#30363d", true: "#238636" }}
          thumbColor={highIntent ? "#3fb950" : "#7d8590"}
          ios_backgroundColor="#30363d"
        />
      </View>

      <SectionLabel>city_profile</SectionLabel>
      <View style={s("flex-row mb-4 bg-gh-chip rounded-md overflow-hidden border border-gh")}>
        <CitySegment label="Berlin" active={city === "berlin"} onPress={onSwapCity} />
        <CitySegment label="Zürich" active={city === "zurich"} onPress={onSwapCity} />
      </View>

      <Pressable
        onPress={onRunSurfacing}
        style={s("bg-gh-btn rounded-md py-3 px-4 items-center")}
      >
        <Text style={s("text-white font-semibold text-[13px]")}>
          {"Run Surfacing Agent  →"}
        </Text>
      </Pressable>
    </View>
  );
}

// ── helpers ────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      style={s(
        "text-[10px] uppercase tracking-[0.5px] text-gh-low mb-2 font-semibold",
      )}
    >
      {children}
    </Text>
  );
}

function SignalChip({ signal }: { signal: DevPanelSignal }) {
  const tone = signal.tone ?? "neutral";
  const valueColor =
    tone === "warning"
      ? s("text-gh-warn")
      : tone === "good"
        ? s("text-gh-good")
        : s("text-white");

  return (
    <View style={s("flex-1 bg-gh-chip rounded-md px-2 py-1.5 border border-gh")}>
      <Text
        style={s("mono text-[10px] uppercase tracking-[0.5px] text-gh-low")}
        numberOfLines={1}
      >
        {signal.label}
      </Text>
      <Text style={[...s("text-[13px] font-semibold mt-0.5"), ...valueColor]} numberOfLines={1}>
        {signal.value}
      </Text>
    </View>
  );
}

function BreakdownBar({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  // Bars are normalised to a 0.30 ceiling — matches the per-feature max
  // contribution in `scoreSurfacing()` (weather 0.28, demand 0.42 capped,
  // proximity 0.20, etc.). 0 → empty, ≥0.30 → full.
  const pct = Math.max(0, Math.min(1, value / 0.3));
  return (
    <View>
      <View style={s("flex-row justify-between mb-1")}>
        <Text style={s("mono text-[10px] text-gh-low")}>{label}</Text>
        <Text
          style={[
            ...s("mono text-[10px]"),
            accent ? s("text-gh-good") : s("text-white"),
          ]}
        >
          {value.toFixed(2)}
        </Text>
      </View>
      <View
        style={[
          ...s("w-full h-[4px] bg-gh-chip rounded-sm overflow-hidden"),
        ]}
      >
        <View
          style={[
            { height: 4, width: `${pct * 100}%` },
            accent ? s("bg-gh-good") : s("bg-gh-border"),
          ]}
        />
      </View>
    </View>
  );
}

function CitySegment({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        ...s("flex-1 items-center py-2"),
        active ? s("bg-gh-btn") : null,
      ]}
    >
      <Text
        style={[
          ...s("text-[11px] font-semibold"),
          active ? s("text-white") : s("text-gh-low"),
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
