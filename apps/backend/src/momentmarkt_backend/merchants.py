"""Static merchant catalog for the wallet drawer search surface.

This module powers ``GET /merchants/{city}`` (issue #115). The Berlin
catalog is hydrated from real OpenStreetMap (Overpass API) places near
Mia's demo center (lat 52.5301, lon 13.4012; near Rosenthaler Platz)
captured 2026-04-26. The 4 canonical density-fixture merchants are
preserved verbatim so signals, density curves, and surfacing keep
working. The remaining ~31 entries are real Berlin Mitte POIs (cafes,
bakeries, bars, bookstores, etc.) so the wallet drawer renders
recognisable names like "St. Oberholz", "Zeit für Brot", "ocelot",
"Mein Haus am See" instead of synthetic ones.

Distances are computed via haversine from Mia's center; all entries
are within 500m of her. Active offers are carried over from the
previous synthetic catalog and re-attached to OSM merchants whose
category matches the original offer's vibe (~12 of ~35 in Berlin,
~3 of 8 in Zurich). Cafe Bondi's offer is locked to the rain-trigger
demo copy.

Zurich catalog stays fully synthetic for now (out of scope for the
OSM scrape).
"""

from __future__ import annotations

from typing import Any

# Allowed categories. Keep in sync with the API contract documented in
# main.py / agreed with the mobile agent.
CATEGORIES = (
    "cafe",
    "bakery",
    "bookstore",
    "kiosk",
    "restaurant",
    "bar",
    "boutique",
    "ice_cream",
    "florist",
)

# Single-glyph avatars by category. The mobile card uses these as a fallback
# when no merchant photo is available (which is always, for this demo).
CATEGORY_EMOJI: dict[str, str] = {
    "cafe": "☕",
    "bakery": "🥨",
    "bookstore": "📚",
    "kiosk": "📰",
    "restaurant": "🍴",
    "bar": "🍷",
    "boutique": "👗",
    "ice_cream": "🍦",
    "florist": "💐",
}


# Cafe Bondi's offer is the canonical rain-trigger demo offer. Do not edit
# without coordinating with the mobile + surfacing agents.
_BONDI_OFFER = {
    "headline": "20% off rainy-day filter coffee",
    "discount": "−20%",
    "expires_at_iso": "2026-04-26T15:00:00+02:00",
}


def _offer(headline: str, discount: str, expires: str = "2026-04-26T18:00:00+02:00") -> dict[str, str]:
    return {"headline": headline, "discount": discount, "expires_at_iso": expires}


# ---------------------------------------------------------------------------
# Berlin catalog (~35 merchants)
# ---------------------------------------------------------------------------
#
# Layout:
#   1) The 4 canonical density-fixture merchants (frozen ids; Cafe Bondi
#      first because the rain-trigger demo cut depends on it).
#   2) Real OpenStreetMap POIs around Mia's center, sorted by distance.
#      Names preserve the OSM ``name`` tag verbatim (umlauts intact).
#      Distances are haversine metres from (52.5301, 13.4012). Slug ids
#      embed a short lat-derived suffix to avoid collisions across
#      future scrapes.
#
# 12 entries carry an ``active_offer``; the rest are ``None`` so the
# wallet drawer's "Offers for you" pill shows a credible mix.

_BERLIN_MERCHANTS: list[dict[str, Any]] = [
    # --- Canonical (must stay in catalog, ids frozen) -----------------------
    {
        "id": "berlin-mitte-cafe-bondi",
        "display_name": "Cafe Bondi",
        "category": "cafe",
        "distance_m": 82,
        "neighborhood": "Mitte",
        "active_offer": _BONDI_OFFER,
    },
    {
        "id": "berlin-mitte-baeckerei-rosenthal",
        "display_name": "Backerei Rosenthal",
        "category": "bakery",
        "distance_m": 128,
        "neighborhood": "Mitte",
        "active_offer": _offer(
            "10% off pretzels after 14:00", "−10%", "2026-04-26T16:00:00+02:00"
        ),
    },
    {
        "id": "berlin-mitte-kiezbuchhandlung-august",
        "display_name": "Kiezbuchhandlung August",
        "category": "bookstore",
        "distance_m": 356,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-eisgarten-weinmeister",
        "display_name": "Eisgarten Weinmeister",
        "category": "ice_cream",
        "distance_m": 545,
        "neighborhood": "Mitte",
        "active_offer": _offer(
            "Buy one scoop, get one half-price", "50% 2nd", "2026-04-26T19:00:00+02:00"
        ),
    },
    # --- Real OSM merchants near Rosenthaler Platz --------------------------
    {
        "id": "berlin-mitte-mein-haus-am-see-02998",
        "display_name": "Mein Haus am See",
        "category": "bar",
        "distance_m": 29,
        "neighborhood": "Mitte",
        "active_offer": _offer(
            "Happy hour spritz €6 until 19:00",
            "−30%",
            "2026-04-26T19:00:00+02:00",
        ),
    },
    {
        "id": "berlin-mitte-sharlie-cheen-bar-03019",
        "display_name": "Sharlie Cheen Bar",
        "category": "bar",
        "distance_m": 37,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-the-barn-03005",
        "display_name": "The Barn",
        "category": "cafe",
        "distance_m": 39,
        "neighborhood": "Mitte",
        "active_offer": _offer("€2 off any pour-over", "€2 off"),
    },
    {
        "id": "berlin-mitte-huong-que-03039",
        "display_name": "Huong Quê",
        "category": "restaurant",
        "distance_m": 40,
        "neighborhood": "Mitte",
        "active_offer": _offer(
            "Pho + iced tea €12 lunch deal", "Lunch €12", "2026-04-26T16:00:00+02:00"
        ),
    },
    {
        "id": "berlin-mitte-rosies-03015",
        "display_name": "Rosie's",
        "category": "bar",
        "distance_m": 45,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-crosta-03046",
        "display_name": "Crosta",
        "category": "restaurant",
        "distance_m": 49,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-100-gramm-lounge-03052",
        "display_name": "100 Gramm Lounge",
        "category": "bar",
        "distance_m": 57,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-fam-dang-02977",
        "display_name": "Fam. Dang",
        "category": "restaurant",
        "distance_m": 61,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-zeit-fur-brot-03038",
        "display_name": "Zeit für Brot",
        "category": "bakery",
        "distance_m": 66,
        "neighborhood": "Mitte",
        "active_offer": _offer(
            "Cinnamon roll + filter coffee €5",
            "Bundle €5",
            "2026-04-26T11:30:00+02:00",
        ),
    },
    {
        "id": "berlin-mitte-late-night-shop-02949",
        "display_name": "Late Night Shop",
        "category": "kiosk",
        "distance_m": 68,
        "neighborhood": "Mitte",
        "active_offer": _offer(
            "2 Club-Mate for €4", "€1 off", "2026-04-26T22:00:00+02:00"
        ),
    },
    {
        "id": "berlin-mitte-aiko-03053",
        "display_name": "Aiko",
        "category": "restaurant",
        "distance_m": 73,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-st-oberholz-02953",
        "display_name": "St. Oberholz",
        "category": "cafe",
        "distance_m": 75,
        "neighborhood": "Mitte",
        "active_offer": _offer(
            "Free pastry with any pour-over",
            "Free side",
            "2026-04-26T17:00:00+02:00",
        ),
    },
    {
        "id": "berlin-mitte-rotation-boutique-03047",
        "display_name": "Rotation Boutique",
        "category": "boutique",
        "distance_m": 75,
        "neighborhood": "Mitte",
        "active_offer": _offer(
            "10% off raincoats today only", "−10%", "2026-04-26T20:00:00+02:00"
        ),
    },
    {
        "id": "berlin-mitte-the-eatery-berlin-03070",
        "display_name": "The Eatery Berlin",
        "category": "restaurant",
        "distance_m": 78,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-mod-coffee-03063",
        "display_name": "Mod Coffee",
        "category": "cafe",
        "distance_m": 84,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-supercoff-03078",
        "display_name": "Supercoff",
        "category": "cafe",
        "distance_m": 88,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-aera-02940",
        "display_name": "AERA",
        "category": "bakery",
        "distance_m": 90,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-croissant-couture-03062",
        "display_name": "Croissant Couture",
        "category": "cafe",
        "distance_m": 92,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-flat-white-03084",
        "display_name": "flat white",
        "category": "cafe",
        "distance_m": 96,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-blumen-vanessa-02995",
        "display_name": "Blumen Vanessa",
        "category": "florist",
        "distance_m": 96,
        "neighborhood": "Mitte",
        "active_offer": _offer(
            "Tulip bunch €7 (was €10)",
            "€3 off",
            "2026-04-26T18:00:00+02:00",
        ),
    },
    {
        "id": "berlin-mitte-vertere-03094",
        "display_name": "Vertere",
        "category": "boutique",
        "distance_m": 108,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-linerie-02903",
        "display_name": "Linerie",
        "category": "boutique",
        "distance_m": 119,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-asthetik-movement-03105",
        "display_name": "ästhetik movement",
        "category": "boutique",
        "distance_m": 121,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-suesse-suende-03109",
        "display_name": "Süße Sünde",
        "category": "ice_cream",
        "distance_m": 126,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-the-market-02965",
        "display_name": "The Market",
        "category": "kiosk",
        "distance_m": 144,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-hokey-pokey-02964",
        "display_name": "Hokey Pokey",
        "category": "ice_cream",
        "distance_m": 171,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-ocelot-03172",
        "display_name": "ocelot",
        "category": "bookstore",
        "distance_m": 220,
        "neighborhood": "Mitte",
        "active_offer": _offer(
            "15% off art books this weekend", "−15%", "2026-04-26T20:00:00+02:00"
        ),
    },
    {
        "id": "berlin-mitte-getraenkekiosk-03185",
        "display_name": "Getränkekiosk",
        "category": "kiosk",
        "distance_m": 235,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-acid-mitte-02798",
        "display_name": "Acid Mitte",
        "category": "bakery",
        "distance_m": 253,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-rosa-canina-02890",
        "display_name": "Rosa Canina",
        "category": "ice_cream",
        "distance_m": 286,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-buchhandlung-a-livraria-02933",
        "display_name": "Buchhandlung a Livraria",
        "category": "bookstore",
        "distance_m": 329,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-antiquariat-wiederhold-03139",
        "display_name": "Antiquariat Wiederhold",
        "category": "bookstore",
        "distance_m": 338,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-bio-konditorei-tillmann-02729",
        "display_name": "Bio-Konditorei Tillmann",
        "category": "bakery",
        "distance_m": 385,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-floristik-live-03346",
        "display_name": "Floristik live",
        "category": "florist",
        "distance_m": 423,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
    {
        "id": "berlin-mitte-blumen-jaeger-03399",
        "display_name": "Blumen Jäger",
        "category": "florist",
        "distance_m": 476,
        "neighborhood": "Mitte",
        "active_offer": None,
    },
]


# ---------------------------------------------------------------------------
# Zurich catalog (~8 merchants, neighborhood "HB") — synthetic, out of scope
# for the OSM scrape.
# ---------------------------------------------------------------------------

_ZURICH_MERCHANTS: list[dict[str, Any]] = [
    {
        "id": "zurich-hb-kafi-viadukt",
        "display_name": "Kafi Viadukt",
        "category": "cafe",
        "distance_m": 115,
        "neighborhood": "HB",
        "active_offer": _offer(
            "12% cashback on filter coffee",
            "−12%",
            "2026-04-26T18:00:00+02:00",
        ),
    },
    {
        "id": "zurich-hb-baeckerei-kleiner",
        "display_name": "Bäckerei Kleiner",
        "category": "bakery",
        "distance_m": 240,
        "neighborhood": "HB",
        "active_offer": None,
    },
    {
        "id": "zurich-hb-buchhandlung-orell-fuessli",
        "display_name": "Buchhandlung Orell Füssli",
        "category": "bookstore",
        "distance_m": 320,
        "neighborhood": "HB",
        "active_offer": None,
    },
    {
        "id": "zurich-hb-kiosk-bahnhof",
        "display_name": "Kiosk Bahnhof",
        "category": "kiosk",
        "distance_m": 60,
        "neighborhood": "HB",
        "active_offer": _offer(
            "CHF 2 off Rivella six-pack",
            "CHF 2 off",
            "2026-04-26T22:00:00+02:00",
        ),
    },
    {
        "id": "zurich-hb-restaurant-zeughauskeller",
        "display_name": "Zeughauskeller",
        "category": "restaurant",
        "distance_m": 780,
        "neighborhood": "HB",
        "active_offer": None,
    },
    {
        "id": "zurich-hb-bar-old-crow",
        "display_name": "Old Crow",
        "category": "bar",
        "distance_m": 540,
        "neighborhood": "HB",
        "active_offer": None,
    },
    {
        "id": "zurich-hb-eisdiele-gelati-am-see",
        "display_name": "Gelati am See",
        "category": "ice_cream",
        "distance_m": 1190,
        "neighborhood": "HB",
        "active_offer": _offer(
            "Two scoops for CHF 5",
            "CHF 1 off",
            "2026-04-26T20:00:00+02:00",
        ),
    },
    {
        "id": "zurich-hb-blumenladen-bahnhof",
        "display_name": "Blumenladen Bahnhof",
        "category": "florist",
        "distance_m": 90,
        "neighborhood": "HB",
        "active_offer": None,
    },
]


# Public registry. ``main.py`` looks up by lowercase city slug.
CATALOG: dict[str, list[dict[str, Any]]] = {
    "berlin": _BERLIN_MERCHANTS,
    "zurich": _ZURICH_MERCHANTS,
}


def list_cities() -> list[str]:
    return sorted(CATALOG.keys())


def get_merchants(city: str) -> list[dict[str, Any]] | None:
    """Return the catalog list for ``city`` (lowercased) or ``None``.

    Returning ``None`` lets the API layer translate a missing city into a
    404 without raising from this pure-data module.
    """

    return CATALOG.get(city.lower())


def search_merchants(
    city: str,
    query: str | None = None,
    limit: int = 50,
) -> list[dict[str, Any]] | None:
    """Substring search over display_name / category / neighborhood.

    - ``query`` is case-insensitive; an empty/None query returns all entries.
    - ``limit`` is applied after filtering, before returning.
    - Returns ``None`` if the city is unknown so callers can 404.
    """

    merchants = get_merchants(city)
    if merchants is None:
        return None
    if not query:
        filtered = list(merchants)
    else:
        needle = query.strip().lower()
        if not needle:
            filtered = list(merchants)
        else:
            filtered = [
                m
                for m in merchants
                if needle in m["display_name"].lower()
                or needle in m["category"].lower()
                or needle in m["neighborhood"].lower()
            ]
    if limit > 0:
        filtered = filtered[:limit]
    return filtered


def emoji_for(category: str) -> str:
    return CATEGORY_EMOJI.get(category, "📍")
