export type SurfacingInput = {
  weatherTrigger: "rain_incoming" | "clear";
  eventEndingSoon: boolean;
  demandGapRatio: number;
  distanceM: number;
  highIntent: boolean;
};

export type SurfacingDecision = {
  score: number;
  threshold: number;
  shouldSurface: boolean;
  headline: string;
  reasons: string[];
};

export function scoreSurfacing(input: SurfacingInput): SurfacingDecision {
  const weather = input.weatherTrigger === "rain_incoming" ? 0.28 : 0;
  const event = input.eventEndingSoon ? 0.08 : 0;
  const demand = clamp(input.demandGapRatio, 0, 0.6) * 0.7;
  const proximity = input.distanceM <= 100 ? 0.2 : input.distanceM <= 250 ? 0.12 : 0.04;
  const highIntentBoost = input.highIntent ? 0.16 : 0;
  const threshold = input.highIntent ? 0.58 : 0.72;
  const score = round2(weather + event + demand + proximity + highIntentBoost);

  return {
    score,
    threshold,
    shouldSurface: score >= threshold,
    headline: input.highIntent
      ? "Mia is in-market. Surface the stronger cocoa offer now."
      : "Rain + quiet cafe. One gentle offer is relevant now.",
    reasons: [
      `weather=${weather.toFixed(2)}`,
      `event=${event.toFixed(2)}`,
      `demand=${demand.toFixed(2)}`,
      `proximity=${proximity.toFixed(2)}`,
      `high_intent=${highIntentBoost.toFixed(2)}`,
    ],
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
