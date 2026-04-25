export const demoSignals = {
  weather: {
    source: "Open-Meteo fixture",
    trigger: "rain_incoming" as const,
    summary: "Rain incoming in Berlin Mitte",
  },
  event: {
    source: "events fixture",
    endingSoon: true,
    summary: "Gallery crowd starts moving in 22 min",
  },
  merchant: {
    source: "OSM + Payone-style density fixture",
    id: "berlin-mitte-cafe-bondi",
    name: "Cafe Bondi",
    distanceM: 82,
    demandGapRatio: 0.54,
    summary: "54% below Saturday 13:30 baseline",
  },
  privacy: {
    intent_token: "intent.warm-drink.browse.lunch",
    h3_cell_r8: "881f1d489dfffff",
  },
};
