# Foursquare Open Source Places — fetch instructions (auth required)

The FSQ OS Places dataset is **gated on HuggingFace** as of 2026-04-25:
the `fsq-os-places-us-east-1` S3 bucket now only holds LICENSE / NOTICE /
stats, and the parquet data lives under
`huggingface.co/datasets/foursquare/fsq-os-places` behind an opt-in.

**Latest release date observed:** `dt=2026-04-14` (100 parquet files, ~10–
20 GB total compressed).

## To download a single partition (after `huggingface-cli login`):

```bash
huggingface-cli download foursquare/fsq-os-places \
  release/dt=2026-04-14/places/parquet/places_000000.parquet \
  --repo-type dataset --local-dir ./fsq-data
```

## To filter to Zürich HB / Berlin Mitte after download (duckdb):

```sql
INSTALL httpfs; LOAD httpfs;

-- Zürich HB ~1km bbox
COPY (
  SELECT fsq_place_id, name, latitude, longitude,
         fsq_category_labels, address, locality, region, country
  FROM read_parquet('fsq-data/release/dt=2026-04-14/places/parquet/*.parquet')
  WHERE latitude  BETWEEN 47.369 AND 47.387
    AND longitude BETWEEN 8.527  AND 8.553
) TO 'zurich-hb.parquet' (FORMAT PARQUET);

-- Berlin Mitte ~1km bbox (Alexanderplatz)
COPY (
  SELECT fsq_place_id, name, latitude, longitude,
         fsq_category_labels, address, locality, region, country
  FROM read_parquet('fsq-data/release/dt=2026-04-14/places/parquet/*.parquet')
  WHERE latitude  BETWEEN 52.513 AND 52.531
    AND longitude BETWEEN 13.398 AND 13.428
) TO 'berlin-mitte.parquet' (FORMAT PARQUET);
```

## Why we did not pre-stage automatically

HF gating requires interactive consent (TOS click + token). Pre-staging
was not possible without the user's HF account. **OSM via Overpass is
already staged as the merchant catalog** (`data/osm/`, 2096 Zürich + 937
Berlin POIs with category, name, lat/lng, opening_hours where present),
so the spec does not block on FSQ.
