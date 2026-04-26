/**
 * LensChips — horizontal selectable chip row that switches the swipe
 * stack's curation strategy (issue #137).
 *
 * Per `context/DESIGN_PRINCIPLES.md` + #137, the swipe stack is the
 * wallet's primary surface and the lens chips are the user-facing
 * mechanic for choosing how the catalog gets re-ranked. The four
 * lenses ship with deliberate role distinction so the LLM's footprint
 * is legible:
 *
 *   For you      → LLM personalisation (cross-merchant + preference)
 *   Best deals   → deterministic discount-magnitude sort, no LLM
 *   Right now    → rule-based weather × category, no LLM
 *   Nearby       → pure distance sort, no LLM and no preference signal
 *                  (the user's escape hatch per principle #4)
 *
 * Visual: spark-tinted active chip with white text; inactive chips are
 * white with cocoa text + ink/8 border. SF Symbol prefix on each chip
 * gives the row some glanceability when the user is scanning sideways.
 *
 * The component is purely presentational — wallet state owns the
 * `active` lens and reacts to `onChange`. No internal animation; the
 * downstream swipe stack handles the cross-fade when the lens changes.
 */

import { SymbolView } from "expo-symbols";
import type { ReactElement } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { SFSymbol } from "sf-symbols-typescript";

import { lightTap } from "../lib/haptics";
import { s } from "../styles";

/** Wire shape shared with `apps/backend/.../alternatives.py::LensKey`. */
export type LensKey = "for_you" | "best_deals" | "right_now" | "nearby";

type LensSpec = {
  key: LensKey;
  /** Short label rendered inside the chip — kept ≤10 chars so 4 chips
   *  fit in one row on a 6.1" iPhone without horizontal scroll. */
  label: string;
  /** SF Symbol prefix so the row reads as a native iOS control. */
  sfSymbol: SFSymbol;
};

/**
 * Lens vocabulary kept colocated with the component so the order is
 * the order the user sees them in the row. "For you" first because it
 * is the default lens at first launch; "Nearby" last because it is the
 * deterministic escape hatch (least-mechanism-in-front-of-the-user).
 */
const LENSES: readonly LensSpec[] = [
  { key: "for_you", label: "For you", sfSymbol: "sparkles" },
  { key: "best_deals", label: "Best deals", sfSymbol: "tag.fill" },
  { key: "right_now", label: "Right now", sfSymbol: "clock.badge.checkmark.fill" },
  { key: "nearby", label: "Nearby", sfSymbol: "location.fill" },
] as const;

type Props = {
  active: LensKey;
  onChange: (lens: LensKey) => void;
};

export function LensChips({ active, onChange }: Props): ReactElement {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // Negative side padding cancels the parent's px-5 so the chip row
      // can bleed to the edge while the rest of the wallet content stays
      // aligned. Internal padding restores the breathing room.
      contentContainerStyle={[
        ...s("flex-row gap-2"),
        { paddingHorizontal: 20, paddingVertical: 4 },
      ]}
      style={{ marginHorizontal: -20 }}
    >
      {LENSES.map((lens) => {
        const isActive = lens.key === active;
        return (
          <LensChip
            key={lens.key}
            spec={lens}
            active={isActive}
            onPress={() => {
              if (!isActive) {
                lightTap();
                onChange(lens.key);
              }
            }}
          />
        );
      })}
    </ScrollView>
  );
}

function LensChip({
  spec,
  active,
  onPress,
}: {
  spec: LensSpec;
  active: boolean;
  onPress: () => void;
}): ReactElement {
  // Active: spark background + white text + white SF Symbol so the
  // chip reads as the "current curation strategy."
  // Inactive: white background + cocoa text + ink/8 border so the row
  // feels like a stack of selectable cards rather than a tab bar.
  const tintColor = active ? "#ffffff" : "#6f3f2c";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${spec.label} lens`}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        ...s("rounded-full flex-row items-center"),
        {
          paddingHorizontal: 14,
          paddingVertical: 9,
          backgroundColor: active ? "#f2542d" : "#ffffff",
          borderWidth: 1,
          borderColor: active ? "#f2542d" : "rgba(23, 18, 15, 0.08)",
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <SymbolView
        name={spec.sfSymbol}
        tintColor={tintColor}
        size={14}
        weight="semibold"
        style={{ width: 14, height: 14, marginRight: 6 }}
      />
      <Text
        style={[
          {
            fontSize: 13,
            fontWeight: "700",
            letterSpacing: 0.2,
            color: active ? "#ffffff" : "#17120f",
          },
        ]}
      >
        {spec.label}
      </Text>
    </Pressable>
  );
}

/**
 * Re-export the lens vocabulary so callers (WalletSheetContent) can
 * iterate it in tests or build a fallback chip strip without
 * duplicating the source-of-truth list.
 */
export const LENS_KEYS: readonly LensKey[] = LENSES.map((l) => l.key);

/** Default lens at app launch — see #137 + DESIGN_PRINCIPLES.md #6. */
export const DEFAULT_LENS: LensKey = "for_you";
