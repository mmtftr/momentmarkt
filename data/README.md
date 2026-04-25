# Pre-staged data

Pulled 2026-04-25 ahead of the CITY WALLET (DSV-Gruppe) track. The track
brief calls for an AI-generated, context-aware local offer driven by
real-time signals: weather, time of day, location, local events, demand
patterns. These signals map 1:1 onto the directories below.

| Dir          | What it is                         | Pre-staged? |
|--------------|------------------------------------|-------------|
| `weather/`   | Open-Meteo current + 48 h forecast | ✅ Zürich + Berlin |
| `osm/`       | Local merchant POIs (Overpass)     | ✅ ~3000 POIs across both bboxes |
| `fsq/`       | Foursquare OS Places               | ⛔ HF-gated — recipe only in `fsq/FETCH_LATER.md` |
| `gtfs/`      | Public-transit stops + schedules   | ✅ VBB (full); CH-wide (filter for ZVV) |
| `events/`    | Local events for demo window       | ✅ hand-curated stub (5/city) |
| `personas/`  | Synthetic users                    | 🛠 generate at runtime (10 personas via LLM) |

Demo bboxes:
- **Zürich HB** ~1 km box: lat 47.369–47.387, lon 8.527–8.553
- **Berlin Mitte** (Alexanderplatz) ~1 km box: lat 52.513–52.531, lon 13.398–13.428

---

## Refresh commands

### Weather (Open-Meteo, no key)

```bash
curl -sS -o data/weather/zurich.json \
  "https://api.open-meteo.com/v1/forecast?latitude=47.3779&longitude=8.5403&current=temperature_2m,precipitation,weather_code,wind_speed_10m,relative_humidity_2m&hourly=temperature_2m,precipitation_probability,precipitation,weather_code&forecast_days=2&timezone=Europe%2FZurich"

curl -sS -o data/weather/berlin.json \
  "https://api.open-meteo.com/v1/forecast?latitude=52.5219&longitude=13.4132&current=temperature_2m,precipitation,weather_code,wind_speed_10m,relative_humidity_2m&hourly=temperature_2m,precipitation_probability,precipitation,weather_code&forecast_days=2&timezone=Europe%2FBerlin"
```

### POIs (Overpass, no key)

```bash
# Zürich HB ~1 km
curl -sS -X POST 'https://overpass-api.de/api/interpreter' \
  -d 'data=[out:json][timeout:60];
      (node(around:1000,47.3779,8.5403)[shop];
       node(around:1000,47.3779,8.5403)[amenity~"^(restaurant|cafe|bar|pub|fast_food|ice_cream|bakery|biergarten|food_court)$"];);
      out body;' \
  -o data/osm/zurich-hb.json

# Berlin Mitte ~1 km
curl -sS -X POST 'https://overpass-api.de/api/interpreter' \
  -d 'data=[out:json][timeout:60];
      (node(around:1000,52.5219,13.4132)[shop];
       node(around:1000,52.5219,13.4132)[amenity~"^(restaurant|cafe|bar|pub|fast_food|ice_cream|bakery|biergarten|food_court)$"];);
      out body;' \
  -o data/osm/berlin-mitte.json
```

### GTFS

```bash
# VBB (Berlin) — direct download
curl -sSL -o data/gtfs/vbb.zip "https://www.vbb.de/vbbgtfs"
unzip -o data/gtfs/vbb.zip -d data/gtfs/vbb/

# Switzerland (covers ZVV) — opentransportdata.swiss permalink
curl -sSL -o data/gtfs/ch-gtfs.zip \
  "https://data.opentransportdata.swiss/dataset/timetable-2026-gtfs2020/permalink"
unzip -o data/gtfs/ch-gtfs.zip stops.txt -d data/gtfs/ch/
```

### Foursquare (gated — needs HuggingFace login)

See `data/fsq/FETCH_LATER.md`. Approx. 100 parquet files, ~10–20 GB
compressed. OSM is the working merchant catalog until/unless this is
needed.

### Events

Both city open-data event endpoints I probed first 404'd. Either find
the current endpoint (Berlin: daten.berlin.de termine; Zürich:
stadt-zuerich.ch open-data portal under `Events` / `Veranstaltungen`),
or keep the committed hand-curated stubs.

---

## Quick exploratory queries

```bash
# How many POIs by category in Zürich HB?
jq '[.elements[] | (.tags.shop // .tags.amenity)] | group_by(.) | map({(.[0]): length}) | add' \
   data/osm/zurich-hb.json

# Stops near Berlin Mitte (Alexanderplatz, ~1 km)
awk -F',' 'NR>1 {gsub(/"/,""); lat=$5+0; lon=$6+0;
            if (lat>=52.513 && lat<=52.531 && lon>=13.398 && lon<=13.428)
              print $3" ("lat","lon")"}' data/gtfs/vbb/stops.txt | head

# Stops near Zürich HB (~1 km)
awk -F',' 'NR>1 {gsub(/"/,""); lat=$3+0; lon=$4+0;
            if (lat>=47.369 && lat<=47.387 && lon>=8.527 && lon<=8.553)
              print $2" ("lat","lon")"}' data/gtfs/ch/stops.txt | head
```

---

## Footprint

- `weather/`: ~5 KB
- `osm/`: ~1.4 MB
- `gtfs/`: ~322 MB (VBB zip + extracted stops; CH zip + extracted stops)
- `events/`: ~8 KB
- `fsq/`: docs only (no data)

Total on disk: ~324 MB. The big chunk is the VBB zip (80 MB) plus
extracted text files. If size becomes a problem, delete the
`stop_times.txt` / `shapes.txt` style files inside the GTFS extracts —
the prototype likely needs only `stops.txt`, `routes.txt`, `agency.txt`.
