"""Cross-merchant preference re-ranker (issue #136).

Takes the candidate merchant list produced by ``alternatives.py`` plus
the user's prior swipe history (per-card ``{merchant_id, dwell_ms,
swiped_right}``) and returns the candidate ``merchant_id`` list
re-ordered by inferred preference.

Demo Truth Boundary
-------------------
On-device SLM (Phi-3-mini / Gemma-2B) is the production swap per
CLAUDE.md's Demo Truth Boundary; the backend Pydantic AI agent below
is the demo's stand-in. Dwell + swipe data leaves the device only
because the LLM lives there for the demo. The architecture-slide
arrow stays the same: the on-device model in production reads the
same `PriorSwipe` shape and emits the same re-ranked list, so this
backend module is the seam, not the contract.

Failure-mode contract
---------------------
Empty preference context → return the candidate list as-is (the
deterministic distance-sort the alternatives module already applied).
LLM failure → fall back to a deterministic heuristic that scores each
candidate by category-match against the categories the user previously
right-swiped on (or dwelled on long enough to count as interest).
"""

from __future__ import annotations

import json
from typing import Any

from pydantic import BaseModel, Field


# Threshold above which dwell time (ms) is treated as "interest" even
# without a right-swipe. 1.2s mirrors the empirical "stopped to read"
# floor commonly used in mobile dwell-attention work.
_DWELL_INTEREST_MS = 1200


class PriorSwipe(BaseModel):
    """One card the user already saw + responded to in this session.

    `dwell_ms` is the per-card on-screen time before the user committed
    a direction (left/right swipe). `swiped_right` is the binary commit.
    `merchant_id` carries the catalog id so the backend can look up
    category + city for both the heuristic and LLM paths.
    """

    merchant_id: str
    dwell_ms: int = Field(ge=0)
    swiped_right: bool


class _RerankOutput(BaseModel):
    """Pydantic AI structured output: the re-ranked merchant_id list.

    The agent must return *every* candidate id passed in (no
    additions, no drops) so the API layer can trust the list as a
    permutation. The validator below enforces this invariant.
    """

    ranked_merchant_ids: list[str] = Field(
        description="Permutation of the input candidate merchant_ids, best→worst by inferred preference.",
        min_length=1,
    )


def _heuristic_rank(
    candidates: list[dict[str, Any]],
    history: list[PriorSwipe],
    catalog_lookup: dict[str, dict[str, Any]],
) -> list[str]:
    """Distance-sort fallback that biases toward categories the user
    has previously dwelled on or right-swiped.

    Score per candidate = base distance penalty + category-affinity
    bonus + anchor bonus. Lower score sorts first. Anchor is always
    pinned to position 0 so the user's tapped merchant stays the
    safety card (matches `alternatives.py::_candidate_merchants`).
    """
    # Build a per-category interest score from the swipe history.
    category_score: dict[str, float] = {}
    for entry in history:
        meta = catalog_lookup.get(entry.merchant_id)
        if not meta:
            continue
        cat = meta.get("category", "")
        if not cat:
            continue
        bonus = 0.0
        if entry.swiped_right:
            bonus += 1.0
        elif entry.dwell_ms >= _DWELL_INTEREST_MS:
            bonus += 0.4
        else:
            # fast left-swipe → mild negative for the category
            bonus -= 0.3
        category_score[cat] = category_score.get(cat, 0.0) + bonus

    def _key(candidate: dict[str, Any]) -> tuple[int, float]:
        # Anchor pinned first.
        is_anchor = 0 if candidate.get("is_anchor") else 1
        cat = candidate.get("merchant_category") or candidate.get("category") or ""
        affinity = category_score.get(cat, 0.0)
        distance = float(candidate.get("distance_m", 1_000))
        # Lower score sorts first. Affinity reduces the score; distance
        # adds to it. Affinity bonus is bounded to keep distance
        # meaningful (don't pull a 2km cafe ahead of a 50m one just
        # because the category had 1 right-swipe).
        score = distance - min(affinity, 2.0) * 250.0
        return (is_anchor, score)

    return [c["merchant_id"] for c in sorted(candidates, key=_key)]


async def rerank_candidates(
    *,
    candidates: list[dict[str, Any]],
    history: list[PriorSwipe],
    catalog_lookup: dict[str, dict[str, Any]],
    use_llm: bool | None = None,
) -> list[str]:
    """Re-rank ``candidates`` by inferred preference, anchor first.

    Returns a permutation of the input candidate ``merchant_id`` list.
    Empty history short-circuits to the input order (the deterministic
    distance-sort already applied by `build_alternatives`). LLM
    failures fall back to the deterministic heuristic above.

    Issue #163: ``use_llm`` resolves through ``llm_agents.default_use_llm``
    when left as ``None`` so the LLM path is the chosen-by-default
    behaviour. The deterministic heuristic above stays as the
    fallback-on-failure path.
    """
    from .llm_agents import default_use_llm

    if use_llm is None:
        use_llm = default_use_llm()
    if not candidates:
        return []
    candidate_ids = [c["merchant_id"] for c in candidates]
    if len(candidates) <= 1 or not history:
        return candidate_ids
    if not use_llm:
        return _heuristic_rank(candidates, history, catalog_lookup)

    try:
        from .llm_agents import _model_name, _run_structured_agent
    except Exception:  # pragma: no cover - import-time failure
        return _heuristic_rank(candidates, history, catalog_lookup)

    instructions = (
        "You are the MomentMarkt cross-merchant preference re-ranker. "
        "You receive a candidate list of nearby merchants (each with a "
        "category + distance_m) and the user's prior swipe history "
        "(merchant_id, dwell_ms, swiped_right). Re-order the candidate "
        "merchant_ids by which the user is MOST likely to swipe right "
        "on, given the inferred category preference + reservation "
        "interest from the dwell pattern.\n"
        "\n"
        "Rules (strict):\n"
        "- Return EVERY input merchant_id exactly once. No additions, "
        "no drops, no synonyms.\n"
        "- Anchor merchant (is_anchor=true) MUST stay in position 0 — "
        "it's the safety card the user tapped.\n"
        "- Use right-swipes as strong positive signal for that "
        "category; long dwells (>1200ms) without a swipe as moderate "
        "interest; fast left-swipes (<500ms) as negative.\n"
        "- When the history is sparse, prefer closer candidates "
        "(smaller distance_m).\n"
        "- Do not invent ids that aren't in the candidate list."
    )
    prompt = {
        "task": "Re-order the candidate merchant_ids by inferred user preference.",
        "candidates": [
            {
                "merchant_id": c["merchant_id"],
                "merchant_display_name": c.get("merchant_display_name"),
                "category": c.get("merchant_category"),
                "distance_m": c.get("distance_m"),
                "is_anchor": bool(c.get("is_anchor")),
            }
            for c in candidates
        ],
        "history": [
            {
                "merchant_id": h.merchant_id,
                "category": (catalog_lookup.get(h.merchant_id) or {}).get("category"),
                "dwell_ms": h.dwell_ms,
                "swiped_right": h.swiped_right,
            }
            for h in history
        ],
    }

    try:
        model = _model_name()
        output = await _run_structured_agent(
            model=model,
            output_type=_RerankOutput,
            instructions=instructions,
            prompt=prompt,
        )
        ranked = list(output.ranked_merchant_ids)
        # Validate the permutation. If the LLM dropped or invented an
        # id, treat it as a soft failure and fall back to the heuristic.
        if set(ranked) != set(candidate_ids):
            return _heuristic_rank(candidates, history, catalog_lookup)
        # Force the anchor to position 0 even if the LLM moved it.
        anchor_id = next(
            (c["merchant_id"] for c in candidates if c.get("is_anchor")),
            None,
        )
        if anchor_id is not None and ranked[0] != anchor_id:
            ranked = [anchor_id] + [mid for mid in ranked if mid != anchor_id]
        return ranked
    except Exception:  # pragma: no cover - provider/network dependent
        return _heuristic_rank(candidates, history, catalog_lookup)


def build_catalog_lookup() -> dict[str, dict[str, Any]]:
    """Build a flat ``merchant_id → merchant`` lookup over both cities.

    Used by `rerank_candidates` to resolve `category` for prior-swipe
    entries. Pure data — safe to call repeatedly.
    """
    from .merchants import get_merchants

    lookup: dict[str, dict[str, Any]] = {}
    for city_slug in ("berlin", "zurich"):
        for entry in get_merchants(city_slug) or []:
            lookup[entry["id"]] = entry
    return lookup


# Re-export for tests; keeps the `json` import live.
__all__ = [
    "PriorSwipe",
    "rerank_candidates",
    "build_catalog_lookup",
    "_heuristic_rank",
]
_ = json  # silence unused-import lint; kept for ad-hoc debugging
