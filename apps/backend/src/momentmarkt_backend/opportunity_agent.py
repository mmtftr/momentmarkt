from __future__ import annotations

import json
import os
from typing import Any

from .genui import coerce_widget_node
from .signals import SignalContext


def fallback_offer(context: SignalContext, high_intent: bool = False) -> dict[str, Any]:
    merchant = context["merchant"]
    max_discount = merchant["offer_budget"].get("max_discount_percent", 15)
    discount = min(max_discount, 20 if high_intent else 15)
    cashback = f"{discount}% cashback"
    headline = (
        f"{merchant['name']} is quiet now. Take the stronger rain offer."
        if high_intent
        else _surface_hint(merchant)
    )
    widget_spec = _rain_widget(context, headline, cashback)

    return {
        "id": f"offer-{merchant['id']}-1330",
        "merchantId": merchant["id"],
        "merchantName": merchant["name"],
        "headline": headline,
        "subhead": _subhead(context, high_intent),
        "discount": cashback,
        "expiresAt": _expires_at(merchant),
        "distanceM": merchant["distance_m"],
        "whySignals": [
            {"label": "Weather", "value": context["weather"]["summary"]},
            {"label": "Demand", "value": merchant["summary"]},
            {"label": "Distance", "value": f"{merchant['distance_m']} m from Mia"},
            {"label": "Merchant goal", "value": merchant["merchant_goal"]},
        ],
        "privacyEnvelope": context["privacy"],
        "widgetSpec": widget_spec,
    }


async def generate_offer(
    context: SignalContext, high_intent: bool = False, use_llm: bool = False
) -> dict[str, Any]:
    generation_log: list[str] = []
    fallback = fallback_offer(context, high_intent=high_intent)

    if use_llm:
        try:
            generated = await _generate_with_litellm(context, high_intent)
            widget_spec, widget_valid = coerce_widget_node(generated.get("widgetSpec"))
            generated["widgetSpec"] = widget_spec
            generated.setdefault("privacyEnvelope", context["privacy"])
            generated.setdefault("distanceM", context["merchant"]["distance_m"])
            generated.setdefault("merchantId", context["merchant"]["id"])
            generated.setdefault("merchantName", context["merchant"]["name"])
            generation_log.append("litellm_generation_succeeded")
            if not widget_valid:
                generation_log.append("generated_widget_invalid_used_fallback_widget")
            return {
                "offer": generated,
                "generated_by": "litellm",
                "widget_valid": widget_valid,
                "used_fallback": False,
                "generation_log": generation_log,
            }
        except Exception as exc:  # pragma: no cover - provider/network dependent
            generation_log.append(f"litellm_generation_failed: {type(exc).__name__}: {exc}")

    generation_log.append("deterministic_fixture_offer")
    widget_spec, widget_valid = coerce_widget_node(fallback["widgetSpec"])
    fallback["widgetSpec"] = widget_spec

    return {
        "offer": fallback,
        "generated_by": "fixture",
        "widget_valid": widget_valid,
        "used_fallback": not use_llm,
        "generation_log": generation_log,
    }


async def _generate_with_litellm(context: SignalContext, high_intent: bool) -> dict[str, Any]:
    model = os.environ.get("MOMENTMARKT_LLM_MODEL")
    if not model:
        raise RuntimeError("MOMENTMARKT_LLM_MODEL is not set")

    from litellm import acompletion  # type: ignore[import-not-found]

    response = await acompletion(
        model=model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are the MomentMarkt Opportunity Agent. Return only valid JSON. "
                    "Generate one city-wallet offer and a React Native GenUI widget spec. "
                    "Allowed widget node types: View, ScrollView, Text, Image, Pressable. "
                    "Pressable nodes must use action='redeem'."
                ),
            },
            {"role": "user", "content": _prompt(context, high_intent)},
        ],
        temperature=0.7,
        response_format={"type": "json_object"},
    )
    content = response.choices[0].message.content
    parsed = json.loads(content)
    if "offer" in parsed:
        parsed = parsed["offer"]
    if not isinstance(parsed, dict):
        raise ValueError("LLM response was not a JSON object")
    return parsed


def _prompt(context: SignalContext, high_intent: bool) -> str:
    payload = {
        "task": "Draft one approved offer for the Expo React Native demo.",
        "required_keys": [
            "id",
            "merchantId",
            "merchantName",
            "headline",
            "subhead",
            "discount",
            "expiresAt",
            "distanceM",
            "whySignals",
            "privacyEnvelope",
            "widgetSpec",
        ],
        "signal_context": context,
        "high_intent": high_intent,
        "copy_rules": [
            "Keep the headline short enough for a mobile card.",
            "Mention why now: weather, demand gap, and proximity.",
            "Use neutral product UI language and no Sparkassen branding.",
            "Widget spec must be renderable through React Native primitives only.",
        ],
    }
    return json.dumps(payload, ensure_ascii=True)


def _surface_hint(merchant: dict[str, Any]) -> str:
    hint = merchant.get("autopilot_rule_hints", {}).get("surface_copy_hint")
    return hint or f"{merchant['name']} has a timely offer nearby."


def _subhead(context: SignalContext, high_intent: bool) -> str:
    merchant = context["merchant"]
    prefix = "High-intent boost unlocked a stronger offer." if high_intent else "Auto-approved rain rule fired."
    return f"{prefix} {merchant['merchant_goal']}"


def _expires_at(merchant: dict[str, Any]) -> str:
    expires = merchant.get("inventory_goal", {}).get("expires_local", "")
    return expires[11:16] if len(expires) >= 16 else "15:00"


def _rain_widget(context: SignalContext, headline: str, discount: str) -> dict[str, Any]:
    merchant = context["merchant"]
    return {
        "type": "ScrollView",
        "className": "rounded-[34px] bg-cocoa",
        "children": [
            {
                "type": "Image",
                "source": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80",
                "accessibilityLabel": "A warm cafe table with coffee on a rainy day",
                "className": "h-44 w-full rounded-t-[34px]",
            },
            {
                "type": "View",
                "className": "p-5",
                "children": [
                    {
                        "type": "Text",
                        "className": "text-xs font-bold uppercase tracking-[3px] text-cream/70",
                        "text": "Opportunity Agent",
                    },
                    {
                        "type": "Text",
                        "className": "mt-3 text-3xl font-black leading-9 text-cream",
                        "text": headline,
                    },
                    {
                        "type": "Text",
                        "className": "mt-3 text-base leading-6 text-cream/80",
                        "text": f"{discount} at {merchant['name']}. {merchant['distance_m']} m away. Valid until {_expires_at(merchant)}.",
                    },
                    {
                        "type": "Pressable",
                        "className": "mt-5 rounded-2xl bg-cream px-5 py-4",
                        "action": "redeem",
                        "text": "Redeem with girocard",
                    },
                ],
            },
        ],
    }
