/*
 * Hand-authored historical and pending moments that fill out the dashboard
 * even when the backend has fired only one offer. The Offers section merges
 * these with live data; the Today section uses the pending subset to drive
 * the "N offers waiting for you" chip count.
 */

import { fallbackWidgetSpec, merchantFixture as merchant, type Moment } from "./merchantStats";

export function seedHistoricalMoments(): Moment[] {
  const cocoa = "cocoa";
  return [
    {
      id: "seed-pending-bakery-quiet",
      source: "fixture",
      headline: "Banana bread + cortado · −12% off",
      triggerLine: "Quiet morning — 32% below typical demand.",
      triggerKind: "demand",
      category: "bakery",
      discountPct: 12,
      status: "pending_approval",
      expiresAt: "12:30",
      redemptions: 0,
      cashbackPerRedeem: 2.5,
      budgetTotal: 60,
      budgetSpent: 0,
      widgetSpec: fallbackWidgetSpec,
      inventoryGoal: 8,
    },
    {
      id: "seed-pending-event",
      source: "fixture",
      headline: "Late-night kombucha · −18%",
      triggerLine: "Concert at Volksbühne ends 22:30 — 800m away.",
      triggerKind: "event",
      category: "drinks",
      discountPct: 18,
      status: "pending_approval",
      expiresAt: "23:30",
      redemptions: 0,
      cashbackPerRedeem: 3,
      budgetTotal: 45,
      budgetSpent: 0,
      widgetSpec: fallbackWidgetSpec,
      inventoryGoal: 6,
    },
    {
      id: "seed-auto-rain-cocoa-1",
      source: "fixture",
      headline: "Rain incoming — warm up at " + merchant.display_name,
      triggerLine: "Rain incoming + 54% demand gap.",
      triggerKind: "rain",
      category: cocoa,
      discountPct: 20,
      status: "auto_approved",
      expiresAt: "15:00",
      redemptions: 9,
      cashbackPerRedeem: 4,
      budgetTotal: 60,
      budgetSpent: 36,
      widgetSpec: fallbackWidgetSpec,
      inventoryGoal: 12,
    },
    {
      id: "seed-auto-aperitivo",
      source: "fixture",
      headline: "Aperitivo hour — espresso martini −15%",
      triggerLine: "Friday wind-down + post-work demand spike.",
      triggerKind: "time",
      category: "drinks",
      discountPct: 15,
      status: "auto_approved",
      expiresAt: "Yesterday 19:00",
      redemptions: 12,
      cashbackPerRedeem: 3.5,
      budgetTotal: 70,
      budgetSpent: 42,
      widgetSpec: fallbackWidgetSpec,
      inventoryGoal: 14,
    },
    {
      id: "seed-auto-filter-coffee",
      source: "fixture",
      headline: "Filter coffee, refilled — €1 off",
      triggerLine: "Quiet morning — 28% below typical.",
      triggerKind: "demand",
      category: cocoa,
      discountPct: 8,
      status: "auto_approved",
      expiresAt: "Yesterday 11:00",
      redemptions: 3,
      cashbackPerRedeem: 1,
      budgetTotal: 25,
      budgetSpent: 3,
      widgetSpec: fallbackWidgetSpec,
      inventoryGoal: 5,
    },
    {
      id: "seed-active-rain-cocoa-2",
      source: "fixture",
      headline: "Hot cocoa + banana bread — " + merchant.display_name,
      triggerLine: "Rain holding through 15:00 · 54% demand gap.",
      triggerKind: "rain",
      category: cocoa,
      discountPct: 18,
      status: "approved",
      expiresAt: "15:00",
      redemptions: 4,
      cashbackPerRedeem: 4,
      budgetTotal: 60,
      budgetSpent: 16,
      widgetSpec: fallbackWidgetSpec,
      inventoryGoal: 12,
    },
  ];
}

export function mergeMomentsById(...sources: Moment[][]): Moment[] {
  const byId = new Map<string, Moment>();
  for (const source of sources) {
    for (const m of source) byId.set(m.id, m);
  }
  return Array.from(byId.values());
}
