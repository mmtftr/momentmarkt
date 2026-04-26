/*
 * Live merchant stats hook + Moment shape — extracted from main.tsx so the
 * Today section and any future v2 surface (e.g. Negotiation Agent activity
 * feed) can reuse the same poll wiring without duplication.
 */

import { useEffect, useState } from "react";
import density from "../../../../data/transactions/berlin-density.json";

export const MERCHANT_ID = "berlin-mitte-cafe-bondi";

export type StoredOffer = {
  id: string;
  city_id: string;
  merchant_id: string;
  merchant_name: string;
  category: string;
  status: string;
  trigger_reason: Record<string, unknown> | string | null;
  copy_seed: { headline_de?: string; headline_en?: string; body_de?: string };
  widget_spec: unknown;
  valid_window: { start?: string; end?: string };
  created_at: string;
  distance_m: number;
  currency: string;
  budget_total: number;
  budget_spent: number;
  cashback_eur: number;
  redemptions: number;
};

export type MerchantStats = {
  merchant_id: string;
  offer_count: number;
  surfaced: number;
  redeemed: number;
  budget_total: number;
  budget_spent: number;
  offers: StoredOffer[];
};

export type MerchantPollState = {
  baseUrl: string;
  error: string | null;
  lastUpdated: Date | null;
  stats: MerchantStats | null;
};

export type MomentStatus = "auto_approved" | "approved" | "pending_approval" | "rejected";

export type Moment = {
  id: string;
  source: "live" | "fixture";
  headline: string;
  triggerLine: string;
  status: MomentStatus;
  expiresAt: string;
  redemptions: number;
  cashbackPerRedeem: number;
  budgetTotal: number;
  budgetSpent: number;
  widgetSpec: unknown;
};

export function findCafeBondi() {
  const cafeBondi = density.merchants.find((entry) => entry.id === MERCHANT_ID);
  if (!cafeBondi) {
    throw new Error("Cafe Bondi is missing from berlin-density.json");
  }
  return cafeBondi;
}

export const merchantFixture = findCafeBondi();
export const approvalRule = merchantFixture.autopilot_rule_hints;
export const cashbackPerRedeem = merchantFixture.offer_budget.max_cashback_eur;
export const totalBudget = merchantFixture.offer_budget.total_budget_eur;
export const fallbackHeadline =
  approvalRule.surface_copy_hint || "Rain incoming — warm up at Bondi";
export const fallbackTrigger = "Rain incoming + 54% demand gap at lunch.";
export const fallbackExpires = merchantFixture.inventory_goal.expires_local;

// Mirror of the deterministic rain widget the Opportunity Agent emits when
// running off the fixture path. Same className vocabulary so the merchant's
// WidgetRenderer here produces the exact visual output the wallet shows.
export const fallbackWidgetSpec = {
  type: "ScrollView" as const,
  className: "rounded-[34px] bg-cocoa",
  children: [
    {
      type: "Image" as const,
      source:
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80",
      accessibilityLabel: "A warm cafe table with coffee on a rainy day",
      className: "h-44 w-full rounded-t-[34px]",
    },
    {
      type: "View" as const,
      className: "p-5",
      children: [
        {
          type: "Text" as const,
          className: "text-xs font-bold uppercase tracking-[3px] text-cream/70",
          text: "Opportunity Agent",
        },
        {
          type: "Text" as const,
          className: "mt-3 text-3xl font-black leading-9 text-cream",
          text: fallbackHeadline,
        },
        {
          type: "Text" as const,
          className: "mt-3 text-base leading-6 text-cream/80",
          text: `${Math.round(cashbackPerRedeem)} € cashback at ${merchantFixture.display_name}. ${merchantFixture.distance_m} m away. Valid until 15:00.`,
        },
        {
          type: "Pressable" as const,
          className: "mt-5 rounded-2xl bg-cream px-5 py-4",
          action: "redeem",
          text: "Redeem with girocard",
        },
      ],
    },
  ],
};

export function useMerchantStats(merchantId: string, intervalMs = 2000) {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const [state, setState] = useState<MerchantPollState>({
    baseUrl,
    error: null,
    lastUpdated: null,
    stats: null,
  });

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        const r = await fetch(`${baseUrl}/merchants/${merchantId}/summary`);
        if (!cancelled && r.ok) {
          const data = (await r.json()) as MerchantStats;
          setState({ baseUrl, error: null, lastUpdated: new Date(), stats: data });
          return;
        }
        if (!cancelled) {
          setState((previous) => ({ ...previous, baseUrl, error: `HTTP ${r.status}` }));
        }
      } catch (error) {
        if (!cancelled) {
          setState((previous) => ({
            ...previous,
            baseUrl,
            error: error instanceof Error ? error.message : "network error",
          }));
        }
      }
    };
    fetchStats();
    const id = setInterval(fetchStats, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [baseUrl, merchantId, intervalMs]);
  return state;
}

export function euro(amount: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: density.currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function percent(value: number) {
  return new Intl.NumberFormat("en", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}

export function timeLabel(date: Date | null) {
  if (!date) return "fixture fallback";
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function shortTime(timeOrDate: string | undefined): string {
  if (!timeOrDate) return "—";
  return timeOrDate.includes("T") ? timeOrDate.slice(11, 16) : timeOrDate;
}

function deriveTriggerLine(triggerReason: StoredOffer["trigger_reason"]): string {
  if (typeof triggerReason === "string") return triggerReason;
  if (!triggerReason || typeof triggerReason !== "object") return fallbackTrigger;
  const parts: string[] = [];
  const weather = (triggerReason as { weather_trigger?: string | null }).weather_trigger;
  if (weather) parts.push(weather.replace(/_/g, " "));
  if ((triggerReason as { demand_trigger?: boolean }).demand_trigger) {
    parts.push("demand gap");
  }
  if ((triggerReason as { event_trigger?: boolean }).event_trigger) {
    parts.push("nearby event");
  }
  return parts.length ? `Triggered by ${parts.join(" + ")}.` : fallbackTrigger;
}

function normalizeStatus(raw: string): MomentStatus {
  if (raw === "auto_approved" || raw === "approved" || raw === "rejected") return raw;
  return "pending_approval";
}

export function offersToMoments(stats: MerchantStats | null): Moment[] {
  if (!stats || stats.offers.length === 0) {
    return [
      {
        id: "fixture-bondi-rain",
        source: "fixture",
        headline: fallbackHeadline,
        triggerLine: fallbackTrigger,
        status: "auto_approved",
        expiresAt: fallbackExpires,
        redemptions: 0,
        cashbackPerRedeem,
        budgetTotal: totalBudget,
        budgetSpent: 0,
        widgetSpec: fallbackWidgetSpec,
      },
    ];
  }
  return stats.offers.map((offer) => ({
    id: offer.id,
    source: "live",
    headline:
      offer.copy_seed.headline_de ||
      offer.copy_seed.headline_en ||
      offer.merchant_name,
    triggerLine: deriveTriggerLine(offer.trigger_reason),
    status: normalizeStatus(offer.status),
    expiresAt: offer.valid_window?.end || fallbackExpires,
    redemptions: offer.redemptions,
    cashbackPerRedeem: offer.cashback_eur,
    budgetTotal: offer.budget_total,
    budgetSpent: offer.budget_spent,
    widgetSpec: offer.widget_spec,
  }));
}

export const STATUS_LABELS: Record<
  MomentStatus,
  { label: string; pillClass: string; dotClass: string }
> = {
  auto_approved: { label: "Auto-approved", pillClass: "is-auto", dotClass: "is-spark" },
  approved: { label: "Approved", pillClass: "is-approved", dotClass: "is-good" },
  pending_approval: { label: "Awaiting review", pillClass: "is-pending", dotClass: "is-rain" },
  rejected: { label: "Rejected", pillClass: "is-rejected", dotClass: "is-rain" },
};

export { density };
