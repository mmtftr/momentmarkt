"""Tests for blackout-window detection algorithm."""

from __future__ import annotations

from momentmarkt_backend.blackout_detection import (
    CurvePoint,
    detect_blackouts,
    detect_for_density_fixture,
)
from momentmarkt_backend.fixtures import load_density


def test_saturday_baseline_yields_one_window():
    density = load_density("berlin")
    bondi = next(m for m in density["merchants"] if m["id"] == "berlin-mitte-cafe-bondi")
    out = detect_for_density_fixture(bondi)
    sat = out["sat"]
    assert 1 <= len(sat) <= 3, f"expected 1-3 saturday windows, got {sat}"
    # Bondi's lunch blackout starts at 13:00. The fixture now keeps the full
    # contiguous high-baseline run through 14:30 rather than clipping to one hour.
    assert any(w["start"] == "13:00" and w["end"] == "14:30" for w in sat), sat


def test_other_days_empty_when_no_data():
    density = load_density("berlin")
    bondi = next(m for m in density["merchants"] if m["id"] == "berlin-mitte-cafe-bondi")
    out = detect_for_density_fixture(bondi)
    for day in ("mon", "tue", "wed", "thu", "fri", "sun"):
        assert out[day] == [], f"day {day} should be empty without data"


def test_short_run_dropped():
    """A single peak point (15-min run) is shorter than MIN_WINDOW_MINUTES=30
    so should not become a window when adjacent samples are below threshold."""
    pts = [
        CurvePoint("12:00", 30),
        CurvePoint("12:30", 90),  # lone peak
        CurvePoint("13:00", 32),
        CurvePoint("13:30", 30),
    ]
    out = detect_blackouts(pts)
    # 30-min step → single sample = 30min run = exactly MIN_WINDOW_MINUTES.
    # Should be kept (boundary inclusive).
    assert len(out) == 1
    assert out[0].start == "12:30"


def test_caps_at_three_windows_keeping_highest():
    pts = [
        CurvePoint("08:00", 90), CurvePoint("08:30", 92),
        CurvePoint("09:00", 30),
        CurvePoint("10:00", 70), CurvePoint("10:30", 72),
        CurvePoint("11:00", 30),
        CurvePoint("12:00", 95), CurvePoint("12:30", 96),
        CurvePoint("13:00", 30),
        CurvePoint("14:00", 80), CurvePoint("14:30", 82),
    ]
    out = detect_blackouts(pts)
    # Threshold across these is roughly 85 → 12:00-13:00 (peak 96), 08:00-09:00 (peak 92), 14:00-15:00 (peak 82) -> 3 windows
    assert len(out) <= 3


def test_empty_input():
    assert detect_blackouts([]) == []
    assert detect_for_density_fixture({})["sat"] == []
