from fastapi.testclient import TestClient

from momentmarkt_backend.main import app


client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_signals_returns_canonical_bondi_context() -> None:
    response = client.get("/signals/berlin")
    assert response.status_code == 200
    payload = response.json()
    assert payload["merchant"]["id"] == "berlin-mitte-cafe-bondi"
    assert payload["weather"]["trigger"] == "rain_incoming"
    assert payload["privacy"]["h3_cell_r8"] == "881f1d489dfffff"


def test_zurich_config_swap_exposes_chf_and_clear_weather() -> None:
    response = client.get("/signals/zurich")
    assert response.status_code == 200
    payload = response.json()
    assert payload["currency"] == "CHF"
    assert payload["weather"]["trigger"] == "clear"
    assert payload["privacy"]["h3_cell_r8"] == "881f8d4b29fffff"


def test_opportunity_fallback_returns_valid_widget() -> None:
    response = client.post("/opportunity/generate", json={"city": "berlin"})
    assert response.status_code == 200
    payload = response.json()
    offer = payload["offer"]
    assert payload["generated_by"] == "fixture"
    assert payload["widget_valid"] is True
    assert offer["merchantId"] == "berlin-mitte-cafe-bondi"
    assert offer["widgetSpec"]["type"] == "ScrollView"


def test_high_intent_changes_discount_and_copy() -> None:
    response = client.post(
        "/opportunity/generate",
        json={"city": "berlin", "high_intent": True},
    )
    assert response.status_code == 200
    offer = response.json()["offer"]
    assert offer["discount"] == "20% cashback"
    assert "stronger rain offer" in offer["headline"]


def test_unknown_merchant_is_404() -> None:
    response = client.get("/signals/berlin?merchant_id=missing")
    assert response.status_code == 404
