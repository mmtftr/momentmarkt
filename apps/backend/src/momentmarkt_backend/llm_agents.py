from __future__ import annotations

import json
import os
from typing import Any, Literal

from pydantic import BaseModel, Field


class ValidWindow(BaseModel):
    start: str
    end: str


class CopySeed(BaseModel):
    headline_de: str
    headline_en: str
    body_de: str
    body_en: str


class OfferDraft(BaseModel):
    discount_type: Literal["percent", "fixed", "item"]
    discount_value: int | float | str
    valid_window: ValidWindow
    copy_seed: CopySeed
    mood_image_key: str
    cta: str


class OpportunityDraftOutput(BaseModel):
    offer: OfferDraft
    widget_spec: dict[str, Any] = Field(description="React Native GenUI primitive tree")


class HeadlineRewriteOutput(BaseModel):
    headline_final: str = Field(description="Final short in-app card headline")


async def run_opportunity_agent(context: dict[str, Any]) -> dict[str, Any]:
    model = _model_name()
    instructions = (
        "You are the MomentMarkt Opportunity Agent. Draft one merchant offer "
        "and one React Native GenUI widget spec. Return only the structured "
        "output. The widget tree may only use View, ScrollView, Text, Image, "
        "and Pressable. Pressable must use action='redeem'. Do not use high "
        "intent signals; Surfacing owns per-user behavior."
    )
    prompt = {
        "task": "Draft one Opportunity Agent output for a merchant inbox.",
        "required_contract": "{ offer, widget_spec }",
        "signal_context": context,
        "copy_rules": [
            "Use the fired weather/event/demand signals.",
            "Keep card copy short enough for a phone.",
            "Use neutral product UI language and no Sparkassen branding.",
            "Keep discount inside the merchant budget.",
        ],
    }
    output = await _run_structured_agent(
        model=model,
        output_type=OpportunityDraftOutput,
        instructions=instructions,
        prompt=prompt,
    )
    return output.model_dump(mode="json")


async def run_headline_rewrite_agent(
    offer: dict[str, Any],
    wrapped_user_context: dict[str, Any],
    aggressive: bool,
) -> str:
    model = _model_name()
    instructions = (
        "You are the MomentMarkt Surfacing Agent headline rewriter. Rewrite "
        "only the final in-app card headline for the already-approved offer. "
        "Do not change discount, widget layout, or offer body. Keep it short."
    )
    prompt = {
        "task": "Rewrite one headline for the current wrapped user context.",
        "offer_copy_seed": offer["copy_seed"],
        "wrapped_user_context": wrapped_user_context,
        "style": "more direct and conversion-oriented" if aggressive else "gentle and contextual",
    }
    output = await _run_structured_agent(
        model=model,
        output_type=HeadlineRewriteOutput,
        instructions=instructions,
        prompt=prompt,
    )
    return output.headline_final


async def _run_structured_agent(
    model: str,
    output_type: type[BaseModel],
    instructions: str,
    prompt: dict[str, Any],
) -> BaseModel:
    from pydantic_ai import Agent

    agent = Agent(model, output_type=output_type, instructions=instructions)
    result = await agent.run(json.dumps(prompt, ensure_ascii=True))
    return result.output


def _model_name() -> str:
    model = os.environ.get("MOMENTMARKT_PYDANTIC_AI_MODEL") or os.environ.get(
        "MOMENTMARKT_LLM_MODEL"
    )
    if not model:
        raise RuntimeError("MOMENTMARKT_PYDANTIC_AI_MODEL is not set")
    if ":" not in model:
        raise RuntimeError(
            "Pydantic AI model names must include a provider prefix, e.g. openai:gpt-5.2"
        )
    return model
