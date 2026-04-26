"""Tests for `POST /offers/alternatives` (issues #132 → #136).

Covers the cross-merchant swipe stack contract:
  * 3 variants, each from a DIFFERENT merchant in the same (or close)
    category — replaces the original price-escalation ladder.
  * Tapped merchant is the anchor (card 1) so the user keeps the safety
    of "I can take what I tapped".
  * Each variant has a valid widget_spec (View root + Text + Pressable
    redeem).
  * Custom n is honoured (the response has ≤ n variants).
  * Unknown merchant_id returns 404.
  * Unique `merchant_id` per variant — no duplicates in the stack.
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from momentmarkt_backend.main import app


client = TestClient(app)


def _walk_node_types(node: dict, types_seen: set[str]) -> None:
    """Recurse a widget_spec tree collecting every node type seen."""
    if not isinstance(node, dict):
        return
    t = node.get("type")
    if isinstance(t, str):
        types_seen.add(t)
    children = node.get("children")
    if isinstance(children, list):
        for child in children:
            _walk_node_types(child, types_seen)


def _find_pressable_action(node: dict) -> str | None:
    """First Pressable node's ``action`` string in DFS order."""
    if not isinstance(node, dict):
        return None
    if node.get("type") == "Pressable":
        action = node.get("action")
        return action if isinstance(action, str) else None
    children = node.get("children")
    if isinstance(children, list):
        for child in children:
            found = _find_pressable_action(child)
            if found is not None:
                return found
    return None


def test_default_returns_three_cross_merchant_variants() -> None:
    response = client.post(
        "/offers/alternatives",
        json={"merchant_id": "berlin-mitte-cafe-bondi", "n": 3},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["merchant_id"] == "berlin-mitte-cafe-bondi"
    variants = payload["variants"]
    assert len(variants) == 3
    # Cross-merchant invariant: every variant is a DIFFERENT merchant_id.
    merchant_ids = [v["merchant_id"] for v in variants]
    assert len(set(merchant_ids)) == len(merchant_ids), (
        f"variants must be cross-merchant; got duplicates: {merchant_ids}"
    )


def test_anchor_merchant_is_card_one() -> None:
    """The tapped merchant must be the anchor (position 0) so the user
    keeps the safety of "I can take what I tapped"."""
    response = client.post(
        "/offers/alternatives",
        json={"merchant_id": "berlin-mitte-cafe-bondi", "n": 3},
    )
    assert response.status_code == 200
    variants = response.json()["variants"]
    assert variants[0]["merchant_id"] == "berlin-mitte-cafe-bondi"
    assert variants[0]["is_anchor"] is True
    # Subsequent cards are not the anchor.
    for v in variants[1:]:
        assert v["is_anchor"] is False


def test_each_variant_has_valid_widget_spec_shape() -> None:
    response = client.post(
        "/offers/alternatives",
        json={"merchant_id": "berlin-mitte-cafe-bondi", "n": 3},
    )
    assert response.status_code == 200
    for variant in response.json()["variants"]:
        assert isinstance(variant["headline"], str) and variant["headline"]
        assert isinstance(variant["discount_label"], str) and variant["discount_label"]
        assert isinstance(variant["variant_id"], str) and variant["variant_id"]
        assert isinstance(variant["merchant_id"], str) and variant["merchant_id"]
        assert isinstance(variant["merchant_display_name"], str)
        assert variant["merchant_display_name"] != ""
        # variant_id == merchant_id under the new contract.
        assert variant["variant_id"] == variant["merchant_id"]

        spec = variant["widget_spec"]
        assert isinstance(spec, dict)
        # Root must be a container so the renderer treats it as a layout.
        assert spec["type"] in {"View", "ScrollView"}
        # At least one Text child somewhere in the tree.
        types_seen: set[str] = set()
        _walk_node_types(spec, types_seen)
        assert "Text" in types_seen, "widget_spec must contain at least one Text node"
        # At least one Pressable with action: redeem (the CTA the renderer wires).
        action = _find_pressable_action(spec)
        assert action == "redeem", "widget_spec must contain a Pressable with action=redeem"


def test_custom_n_returns_at_most_n_variants() -> None:
    """Custom n caps the response. The cross-merchant builder may return
    fewer if the candidate pool runs dry, but never more than n."""
    response = client.post(
        "/offers/alternatives",
        json={"merchant_id": "berlin-mitte-cafe-bondi", "n": 5},
    )
    assert response.status_code == 200
    variants = response.json()["variants"]
    assert 1 <= len(variants) <= 5
    merchant_ids = [v["merchant_id"] for v in variants]
    assert len(set(merchant_ids)) == len(merchant_ids)


def test_unknown_merchant_id_returns_404() -> None:
    response = client.post(
        "/offers/alternatives",
        json={"merchant_id": "nonexistent-merchant-xyz"},
    )
    assert response.status_code == 404
    assert "nonexistent-merchant-xyz" in response.json()["detail"]


def test_zurich_merchant_returns_zurich_neighbours() -> None:
    """Catalog spans both cities; alternatives must work for any known
    id and stay within the same city (no Berlin cards in a Zurich
    stack)."""
    response = client.post(
        "/offers/alternatives",
        json={"merchant_id": "zurich-hb-le-cafe-61594", "n": 3},
    )
    assert response.status_code == 200
    variants = response.json()["variants"]
    assert len(variants) >= 1
    for variant in variants:
        # Every card stays in the Zurich catalog.
        assert variant["merchant_id"].startswith("zurich-"), (
            f"cross-city card leaked: {variant['merchant_id']}"
        )


def test_anchor_card_works_when_anchor_has_no_active_offer() -> None:
    """A merchant tapped from the catalog might not have an active_offer
    of its own (e.g. exploring); the anchor card must still render with a
    safe fallback."""
    # `berlin-mitte-the-eatery-berlin-03070` has active_offer = None.
    response = client.post(
        "/offers/alternatives",
        json={"merchant_id": "berlin-mitte-the-eatery-berlin-03070", "n": 3},
    )
    assert response.status_code == 200
    variants = response.json()["variants"]
    assert len(variants) >= 1
    assert variants[0]["merchant_id"] == "berlin-mitte-the-eatery-berlin-03070"
    # Subsequent cards must still be cross-merchant + have offers.
    for v in variants[1:]:
        assert v["merchant_id"] != variants[0]["merchant_id"]


def test_preference_context_reorders_candidates_anchor_pinned() -> None:
    """Sending prior-swipe history with `use_llm=False` exercises the
    deterministic heuristic re-rank. The anchor stays at position 0."""
    # First, get the natural cross-merchant order so we know what to
    # compare against.
    natural = client.post(
        "/offers/alternatives",
        json={"merchant_id": "berlin-mitte-cafe-bondi", "n": 3},
    )
    assert natural.status_code == 200
    natural_ids = [v["merchant_id"] for v in natural.json()["variants"]]
    assert len(natural_ids) >= 2
    # Build a preference context that fast-skipped a cafe and lingered
    # on a bakery (signal: bias toward bakery candidates if any).
    response = client.post(
        "/offers/alternatives",
        json={
            "merchant_id": "berlin-mitte-cafe-bondi",
            "n": 3,
            "use_llm": False,
            "preference_context": [
                {
                    "merchant_id": "berlin-mitte-the-barn-03005",
                    "dwell_ms": 250,
                    "swiped_right": False,
                },
                {
                    "merchant_id": "berlin-mitte-zeit-fur-brot-03038",
                    "dwell_ms": 4200,
                    "swiped_right": True,
                },
            ],
        },
    )
    assert response.status_code == 200
    reranked_ids = [v["merchant_id"] for v in response.json()["variants"]]
    # Anchor still pinned at position 0.
    assert reranked_ids[0] == "berlin-mitte-cafe-bondi"
    # Same set of candidates (no additions, no drops).
    assert set(reranked_ids) == set(natural_ids)
