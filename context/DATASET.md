# Dataset

Pre-staged on 2026-04-25 ahead of the CITY WALLET track reveal. All data
lives under `data/` in the project root. None of these are "the official
challenge dataset" — none was provided. They are real-world signal
fixtures (weather, POIs, transit, events) chosen to underpin a context-
aware local-offer recommender, plus a planned synthetic-personas slot.

## Location

`data/` (relative to project root)

```
data/
├── weather/        Open-Meteo current + 2-day hourly (Zürich + Berlin)
├── osm/            Overpass POI dumps near Zürich HB + Berlin Mitte
├── fsq/            Foursquare (gated — fetch instructions only, see FETCH_LATER.md)
├── gtfs/           VBB (Berlin) + CH-wide (Zürich) GTFS feeds
├── events/         Hand-curated event stubs for the demo window
└── personas/       Empty — generate at runtime with an LLM (see notes)
```

## Format

| Source            | Path                                | Format        | Size   |
|-------------------|-------------------------------------|---------------|--------|
| Open-Meteo        | `data/weather/{zurich,berlin}.json` | JSON          | ~2.3 KB each |
| OSM (Overpass)    | `data/osm/zurich-hb.json`           | Overpass JSON | 907 KB (2096 nodes) |
| OSM (Overpass)    | `data/osm/berlin-mitte.json`        | Overpass JSON | 499 KB (937 nodes)  |
| GTFS Berlin (VBB) | `data/gtfs/vbb.zip` + `vbb/*.txt`   | GTFS zip      | 80 MB zip; 41 977 stops total, **403 within 1 km of Alexanderplatz** |
| GTFS Switzerland  | `data/gtfs/ch-gtfs.zip` + `ch/*.txt`| GTFS zip      | (CH-wide; 97 332 stops total, **40 within 1 km of Zürich HB**) |
| Events Zürich     | `data/events/zurich-events.json`    | JSON (stub)   | 5 events |
| Events Berlin     | `data/events/berlin-events.json`    | JSON (stub)   | 5 events |

## Access notes

- **Open-Meteo**: no auth, no key. Re-fetch at any time via the URLs in
  `data/README.md`. Snapshot here is from 2026-04-25 ~17:00 local.
- **Overpass**: no auth. Public endpoint, occasionally rate-limited.
  Original QL queries are in `data/README.md`.
- **GTFS VBB**: pulled from `https://www.vbb.de/vbbgtfs` (public, no
  auth). Schedule data current as of 2026-04-23.
- **GTFS Switzerland**: `data.opentransportdata.swiss` permalink for
  `timetable-2026-gtfs2020`. CH-wide, not just ZVV — filter by stop_lat /
  stop_lon for Zürich. Current as of 2026-04-22.
- **Foursquare OS Places**: **gated** behind HuggingFace TOS. The
  `fsq-os-places-us-east-1` S3 bucket no longer hosts the parquet
  (only LICENSE / NOTICE / stats remain). See
  `data/fsq/FETCH_LATER.md` for the auth + duckdb filter recipe.
  **OSM is the de facto merchant catalog** for now (already plentiful,
  3033 POIs across both demo bboxes).
- **Events**: both `berlin.de` and `stadt-zuerich.ch` open-data
  endpoints I tried 404'd on first probe. The committed JSON is a
  hand-curated stub with 5 plausible events per city, covering the
  hackathon weekend. Mark these as fixtures, not truth.
- **Personas**: per the user's plan, generate 10 synthetic personas at
  runtime via the LLM (name, age band, home/work neighbourhood,
  interests, payment habits) and hardcode into the prototype. No file
  staged — the slot exists in `data/personas/` for output.

## Known documentation

- Open-Meteo API docs: https://open-meteo.com/en/docs
- Overpass QL: https://wiki.openstreetmap.org/wiki/Overpass_API
- GTFS reference: https://gtfs.org/schedule/reference/
- VBB GTFS metadata: https://www.vbb.de/vbb-services/api-open-data/datensaetze/
- Foursquare OS Places repo (note: data location has moved):
  https://huggingface.co/datasets/foursquare/fsq-os-places

## Shape (if quickly knowable)

- Weather: current snapshot + 48 h hourly forecast per city; ~15 fields
  per city.
- OSM Zürich HB bbox: 2096 POI nodes (shops + food/drink amenities).
- OSM Berlin Mitte bbox: 937 POI nodes (same filter).
- GTFS VBB: 41 977 stops, 403 within ~1 km of Alexanderplatz.
- GTFS CH: 97 332 stops, 40 within ~1 km of Zürich HB.
- Events: 5 fixtures per city for Apr 25–26 2026.

## Sensitive content

None. All sources are public open data. The events stub is fictionalised
plausible content — not real ticketing data — and is labelled as such in
the JSON `note` field.
