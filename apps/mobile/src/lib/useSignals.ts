/**
 * apps/mobile/src/lib/useSignals.ts (issue #124)
 *
 * Tiny React hook that wires the silent-step weather pill + wallet weather
 * card to the live `/signals/{city}` endpoint, with a deterministic per-city
 * fallback for the demo recording.
 *
 * Contract:
 *   - Always returns a fully-formed `CitySignals` object — never `null`,
 *     never partial — so call sites can dereference `tempC`/`weatherLabel`/
 *     `pulseLabel`/`weatherSfSymbol` without guards.
 *   - On mount (and on every `city` change) it kicks off `fetchSignals`. If
 *     the fetch resolves with a real payload, state is replaced. If the
 *     fetch returns `null` (network / non-2xx / parse failure) the hardcoded
 *     fallback is kept — the demo never shows an error state.
 *   - The previous in-flight fetch is aborted on city change / unmount so
 *     stale responses can't clobber a fresher city's signals.
 */

import { useEffect, useState } from "react";

import { fetchSignals, type CitySignals } from "./api";

/**
 * Per-city deterministic fallback. These match the strings the wallet UI
 * shipped with before the backend wiring (issue #124) so the demo recording
 * stays pixel-identical when the HF Space is unreachable.
 */
const FALLBACKS: Record<string, CitySignals> = {
  berlin: {
    city: "berlin",
    tempC: 11,
    weatherLabel: "overcast • rain in ~22 min",
    pulseLabel: "Rain in ~22 min",
    weatherSfSymbol: "cloud.heavyrain.fill",
  },
  zurich: {
    city: "zurich",
    tempC: 14,
    weatherLabel: "clear • light breeze",
    pulseLabel: "Clear · light breeze",
    weatherSfSymbol: "sun.max.fill",
  },
};

function fallbackFor(city: string): CitySignals {
  return FALLBACKS[city] ?? FALLBACKS.berlin;
}

export function useSignals(city: string): CitySignals {
  const [signals, setSignals] = useState<CitySignals>(() => fallbackFor(city));

  useEffect(() => {
    // Reset to the city's fallback immediately so a stale previous-city
    // value never flashes between the city swap and the fetch resolving.
    setSignals(fallbackFor(city));
    const ctrl = new AbortController();
    fetchSignals(city, ctrl.signal).then((res) => {
      if (ctrl.signal.aborted) return;
      if (res) setSignals(res);
    });
    return () => ctrl.abort();
  }, [city]);

  return signals;
}
