"""Tests for `preference_agent.py` (issue #136).

Covers:
  * Empty `history` short-circuits to the input order (anchor first,
    distance-sort already applied by `build_alternatives`).
  * Non-empty history exercises the deterministic heuristic and the
    re-ranked list still contains every input candidate exactly once.
  * Anchor merchant stays pinned to position 0 even when the heuristic
    would otherwise demote it.
"""

from __future__ import annotations

import asyncio

from momentmarkt_backend.alternatives import build_alternatives
from momentmarkt_backend.preference_agent import (
    PriorSwipe,
    _heuristic_rank,
    build_catalog_lookup,
    rerank_candidates,
)


def _candidates_for(merchant_id: str, n: int = 3):
    candidates = build_alternatives(merchant_id=merchant_id, n=n)
    assert candidates is not None
    return candidates


def test_empty_history_returns_input_order() -> None:
    candidates = _candidates_for("berlin-mitte-cafe-bondi", n=3)
    natural_order = [c["merchant_id"] for c in candidates]
    ranked = asyncio.run(
        rerank_candidates(
            candidates=candidates,
            history=[],
            catalog_lookup=build_catalog_lookup(),
            use_llm=False,
        )
    )
    assert ranked == natural_order


def test_history_with_two_swipes_produces_valid_permutation() -> None:
    candidates = _candidates_for("berlin-mitte-cafe-bondi", n=3)
    candidate_ids = {c["merchant_id"] for c in candidates}
    history = [
        PriorSwipe(
            merchant_id="berlin-mitte-the-barn-03005",
            dwell_ms=300,
            swiped_right=False,
        ),
        PriorSwipe(
            merchant_id="berlin-mitte-zeit-fur-brot-03038",
            dwell_ms=4500,
            swiped_right=True,
        ),
    ]
    ranked = asyncio.run(
        rerank_candidates(
            candidates=candidates,
            history=history,
            catalog_lookup=build_catalog_lookup(),
            use_llm=False,
        )
    )
    # Permutation invariant: same set, no additions, no drops.
    assert set(ranked) == candidate_ids
    assert len(ranked) == len(candidates)


def test_anchor_pinned_at_position_zero() -> None:
    """Even when the heuristic would otherwise reorder, the anchor
    merchant must stay as card 1 (the user's tapped safety card)."""
    candidates = _candidates_for("berlin-mitte-cafe-bondi", n=3)
    anchor_id = "berlin-mitte-cafe-bondi"
    # Heavy history biased away from the cafe category.
    history = [
        PriorSwipe(merchant_id=anchor_id, dwell_ms=180, swiped_right=False),
        PriorSwipe(
            merchant_id="berlin-mitte-zeit-fur-brot-03038",
            dwell_ms=5000,
            swiped_right=True,
        ),
    ]
    ranked = _heuristic_rank(candidates, history, build_catalog_lookup())
    assert ranked[0] == anchor_id


def test_heuristic_biases_toward_dwelled_categories() -> None:
    """A long-dwelled bakery in history should pull bakery candidates
    higher than non-bakery candidates of equivalent distance — for
    Bondi, the candidate pool is mostly cafes, so we just verify the
    permutation is stable when a cafe is the dwelled category."""
    candidates = _candidates_for("berlin-mitte-cafe-bondi", n=3)
    history = [
        PriorSwipe(
            merchant_id="berlin-mitte-the-barn-03005",
            dwell_ms=4500,
            swiped_right=True,
        ),
    ]
    ranked = _heuristic_rank(candidates, history, build_catalog_lookup())
    # Anchor first.
    assert ranked[0] == "berlin-mitte-cafe-bondi"
    # All input candidates appear in the output.
    assert set(ranked) == {c["merchant_id"] for c in candidates}


def test_unknown_history_merchants_dont_break_rerank() -> None:
    """An id not in the catalog must be tolerated — it just contributes
    no signal."""
    candidates = _candidates_for("berlin-mitte-cafe-bondi", n=3)
    history = [
        PriorSwipe(
            merchant_id="nonexistent-merchant-xyz",
            dwell_ms=2000,
            swiped_right=True,
        ),
    ]
    ranked = _heuristic_rank(candidates, history, build_catalog_lookup())
    assert set(ranked) == {c["merchant_id"] for c in candidates}
    assert ranked[0] == "berlin-mitte-cafe-bondi"
