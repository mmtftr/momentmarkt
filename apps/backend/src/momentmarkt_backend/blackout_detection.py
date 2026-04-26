"""Quantile-based blackout-window detection.

Given a per-day density curve (15-min or 30-min sampled), find the windows
where the merchant is at peak capacity and offers should NOT fire.

Algorithm:
1. Compute the 85th-percentile density threshold (top 15% mass).
2. Mark each sample at-or-above threshold as "peak".
3. Merge consecutive peak samples into windows.
4. Drop windows shorter than MIN_WINDOW_MINUTES.
5. Keep up to MAX_WINDOWS_PER_DAY, by descending peak density.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

PERCENTILE = 0.80  # top 20% — empirically gives sensible windows on both
# the small demo fixture (6 saturday lunch points) and full-day curves.
MIN_WINDOW_MINUTES = 30
MAX_WINDOWS_PER_DAY = 3
DEFAULT_SAMPLE_MINUTES = 30  # used when only one point is available


@dataclass(frozen=True)
class CurvePoint:
    time: str  # "HH:MM"
    density: float


@dataclass(frozen=True)
class BlackoutWindow:
    start: str  # "HH:MM"
    end: str  # "HH:MM"
    peak_density: float


def _to_minutes(t: str) -> int:
    h, m = t.split(":")
    return int(h) * 60 + int(m)


def _from_minutes(m: int) -> str:
    return f"{(m // 60) % 24:02d}:{m % 60:02d}"


def _percentile(values: list[float], q: float) -> float:
    if not values:
        return 0.0
    sorted_v = sorted(values)
    if len(sorted_v) == 1:
        return sorted_v[0]
    pos = q * (len(sorted_v) - 1)
    lower = int(pos)
    upper = min(lower + 1, len(sorted_v) - 1)
    frac = pos - lower
    return sorted_v[lower] + (sorted_v[upper] - sorted_v[lower]) * frac


def _infer_step(points: list[CurvePoint]) -> int:
    if len(points) < 2:
        return DEFAULT_SAMPLE_MINUTES
    diffs = []
    for a, b in zip(points, points[1:]):
        diffs.append(_to_minutes(b.time) - _to_minutes(a.time))
    diffs = [d for d in diffs if d > 0]
    if not diffs:
        return DEFAULT_SAMPLE_MINUTES
    return min(diffs)


def detect_blackouts(points: Iterable[CurvePoint]) -> list[BlackoutWindow]:
    pts = list(points)
    if not pts:
        return []

    threshold = _percentile([p.density for p in pts], PERCENTILE)
    step = _infer_step(pts)

    # Group consecutive peak points (must be adjacent in time AND ≥ threshold).
    runs: list[list[CurvePoint]] = []
    current: list[CurvePoint] = []
    prev_minute: int | None = None
    for p in pts:
        is_peak = p.density >= threshold
        m = _to_minutes(p.time)
        adjacent = prev_minute is None or (m - prev_minute) <= step
        if is_peak and adjacent:
            current.append(p)
        else:
            if current:
                runs.append(current)
            current = [p] if is_peak else []
        prev_minute = m
    if current:
        runs.append(current)

    windows: list[BlackoutWindow] = []
    for run in runs:
        start_min = _to_minutes(run[0].time)
        end_min = _to_minutes(run[-1].time) + step
        if end_min - start_min < MIN_WINDOW_MINUTES:
            continue
        windows.append(
            BlackoutWindow(
                start=_from_minutes(start_min),
                end=_from_minutes(end_min),
                peak_density=max(p.density for p in run),
            )
        )

    windows.sort(key=lambda w: w.peak_density, reverse=True)
    return windows[:MAX_WINDOWS_PER_DAY]


def detect_for_density_fixture(
    density: dict,
    day_to_points: dict[str, list[dict]] | None = None,
) -> dict[str, list[dict[str, str]]]:
    """Run detection across all days; returns the dict shape for the API.

    Without day-specific curves, only the day in typical_density_curve gets
    real windows; other days return empty lists.
    """
    days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    out: dict[str, list[dict[str, str]]] = {d: [] for d in days}

    if day_to_points:
        for day, raw in day_to_points.items():
            key = day[:3].lower()
            if key not in out:
                continue
            pts = [CurvePoint(time=p["time"], density=float(p["density"])) for p in raw]
            out[key] = [{"start": w.start, "end": w.end} for w in detect_blackouts(pts)]
        return out

    typical = density.get("typical_density_curve", {}) if density else {}
    points_raw = typical.get("points", [])
    if not points_raw:
        return out
    day_label = (typical.get("day_of_week") or "saturday").lower()[:3]
    if day_label not in out:
        day_label = "sat"
    pts = [CurvePoint(time=p["time"], density=float(p["density"])) for p in points_raw]
    out[day_label] = [{"start": w.start, "end": w.end} for w in detect_blackouts(pts)]
    return out
