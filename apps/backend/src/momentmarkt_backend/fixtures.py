from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from .paths import CITY_CONFIG_DIR, DATA_DIR


Fixture = dict[str, Any]


@lru_cache(maxsize=16)
def load_json(path: str) -> Fixture:
    with Path(path).open("r", encoding="utf-8") as file:
        return json.load(file)


def load_weather(city: str) -> Fixture:
    return load_json(str(DATA_DIR / "weather" / f"{city}.json"))


def load_events(city: str) -> Fixture:
    return load_json(str(DATA_DIR / "events" / f"{city}-events.json"))


def load_density(city: str) -> Fixture:
    return load_json(str(DATA_DIR / "transactions" / f"{city}-density.json"))


def load_city_config(city: str) -> Fixture:
    return load_json(str(CITY_CONFIG_DIR / f"{city}.json"))


def available_cities() -> list[str]:
    if not CITY_CONFIG_DIR.exists():
        return []
    return sorted(path.stem for path in CITY_CONFIG_DIR.glob("*.json"))
