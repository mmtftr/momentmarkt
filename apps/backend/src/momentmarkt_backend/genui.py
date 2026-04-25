from __future__ import annotations

from typing import Any


WidgetNode = dict[str, Any]

ALLOWED_CONTAINER_TYPES = {"View", "ScrollView"}
ALLOWED_LEAF_TYPES = {"Text", "Image", "Pressable"}


fallback_widget_spec: WidgetNode = {
    "type": "View",
    "className": "rounded-[34px] bg-ink p-5",
    "children": [
        {
            "type": "Text",
            "className": "text-xs font-bold uppercase tracking-[3px] text-cream/60",
            "text": "Safe fallback",
        },
        {
            "type": "Text",
            "className": "mt-3 text-3xl font-black leading-9 text-cream",
            "text": "MomentMarkt has a valid offer ready.",
        },
        {
            "type": "Text",
            "className": "mt-3 text-base leading-6 text-cream/80",
            "text": "The generated widget failed validation, so the demo keeps a known-good redemption card.",
        },
        {
            "type": "Pressable",
            "className": "mt-5 rounded-2xl bg-cream px-5 py-4",
            "action": "redeem",
            "text": "Redeem safely",
        },
    ],
}


def validate_widget_node(value: Any, depth: int = 0) -> bool:
    if not isinstance(value, dict) or depth > 12:
        return False

    class_name = value.get("className")
    if class_name is not None and not isinstance(class_name, str):
        return False

    node_type = value.get("type")
    if node_type in ALLOWED_CONTAINER_TYPES:
        children = value.get("children", [])
        return isinstance(children, list) and all(
            validate_widget_node(child, depth + 1) for child in children
        )

    if node_type == "Text":
        return isinstance(value.get("text"), str)

    if node_type == "Image":
        return isinstance(value.get("source"), str) and isinstance(
            value.get("accessibilityLabel"), str
        )

    if node_type == "Pressable":
        return value.get("action") == "redeem" and isinstance(value.get("text"), str)

    return False


def coerce_widget_node(value: Any) -> tuple[WidgetNode, bool]:
    if validate_widget_node(value):
        return value, True
    return fallback_widget_spec, False
