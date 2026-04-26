/**
 * apps/mobile/src/lib/categoryIcon.ts (issue #121)
 *
 * Single source of truth for the category → SF Symbol mapping used by the
 * merchant surfaces (MerchantSearchList card avatars, CityMap pin glyphs).
 * Keeps the visual vocabulary consistent across the wallet drawer and the
 * native Apple Maps fragment so a "cafe" pin and a "cafe" list row share
 * the same glyph + tint without duplicating literals.
 *
 * The `category` string comes from the backend `MerchantListItem.category`
 * (cafe | bakery | bookstore | kiosk | restaurant | bar | boutique |
 * ice_cream | florist | …). Unknown categories fall back to a generic
 * storefront icon so a future backend category never crashes the renderer.
 *
 * SF Symbol names are validated at compile time against the strict
 * `SFSymbol` union from `sf-symbols-typescript` — typos error in tsc.
 */
import type { SFSymbol } from "sf-symbols-typescript";

/** Canonical wallet palette tokens reused for icon tints. Mirror the
 *  cocoa/rain/spark/leaf colors used elsewhere in the cream wallet UI so
 *  category icons read as part of the brand vocabulary, not generic glyphs. */
const TINT = {
  cocoa: "#6f3f2c",
  rain: "#356f95",
  spark: "#f2542d",
  /** gh-good green — borrowed from the GitHub success palette. */
  leaf: "#3fb950",
} as const;

export type CategoryIcon = {
  sfSymbol: SFSymbol;
  tintColor: string;
};

/**
 * Map a backend `category` string to its SF Symbol + tint color. Falls
 * back to a generic `storefront.fill` icon (cocoa) for unknown categories
 * so the renderer never has to special-case missing data.
 */
export function categoryToIcon(category: string): CategoryIcon {
  switch (category) {
    case "cafe":
      return { sfSymbol: "cup.and.saucer.fill", tintColor: TINT.cocoa };
    case "bakery":
      return { sfSymbol: "birthday.cake.fill", tintColor: TINT.cocoa };
    case "bookstore":
      return { sfSymbol: "book.closed.fill", tintColor: TINT.rain };
    case "kiosk":
      return { sfSymbol: "newspaper.fill", tintColor: TINT.cocoa };
    case "restaurant":
      return { sfSymbol: "fork.knife", tintColor: TINT.cocoa };
    case "bar":
      return { sfSymbol: "wineglass.fill", tintColor: TINT.rain };
    case "boutique":
      return { sfSymbol: "bag.fill", tintColor: TINT.spark };
    case "ice_cream":
      return { sfSymbol: "snowflake", tintColor: TINT.rain };
    case "florist":
      return { sfSymbol: "leaf.fill", tintColor: TINT.leaf };
    // Legacy CityMap categories still used by the default Berlin pin set.
    case "fitness":
      return { sfSymbol: "figure.run", tintColor: TINT.spark };
    case "supermarket":
      return { sfSymbol: "cart.fill", tintColor: TINT.cocoa };
    default:
      return { sfSymbol: "storefront.fill", tintColor: TINT.cocoa };
  }
}
