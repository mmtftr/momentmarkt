/**
 * apps/mobile/src/lib/api.ts (issue #45)
 *
 * Thin fetch helpers for the MomentMarkt FastAPI backend.
 *
 * Why a tiny wrapper instead of a full client (axios/swr)?
 *   The mobile demo MUST stay recordable when the backend is unreachable
 *   (per AGENTS.md "Required fallback"). Every helper here returns `null`
 *   on any failure (network, non-2xx, JSON parse). Callers fall back to
 *   the local fixtures in `src/demo/cityProfiles.ts` and friends.
 *
 * Base URL resolution:
 *   - `EXPO_PUBLIC_API_URL` env var (set in `apps/mobile/.env.example`)
 *   - falls back to the live Hugging Face Spaces deploy
 *
 * NOTE: `/signals/{city}` and `/opportunity/generate` currently return
 * "Unknown city" on the HF deploy (issue #61). Do not add helpers for
 * those endpoints until #61 is resolved.
 */

const DEFAULT_API_URL = "https://peaktwilight-momentmarkt-api.hf.space";

export function apiBase(): string {
  return process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;
}

export type HealthStatus = { status: string };

export type MerchantSummary = {
  merchant_id: string;
  offer_count: number;
  surfaced: number;
  redeemed: number;
  budget_total: number;
  budget_spent: number;
  offers: Array<{ id: string; title?: string; status?: string }>;
};

export type City = {
  id: string;
  city: string;
  display_area: string;
  currency: string;
  timezone: string;
  // …other fields exist on the backend; only declare the ones the mobile uses.
};

export type CitiesResponse = { cities: City[] };

export async function fetchHealth(
  signal?: AbortSignal,
): Promise<HealthStatus | null> {
  try {
    const r = await fetch(`${apiBase()}/health`, { signal });
    if (!r.ok) return null;
    return (await r.json()) as HealthStatus;
  } catch {
    return null;
  }
}

export async function fetchCities(
  signal?: AbortSignal,
): Promise<CitiesResponse | null> {
  try {
    const r = await fetch(`${apiBase()}/cities`, { signal });
    if (!r.ok) return null;
    return (await r.json()) as CitiesResponse;
  } catch {
    return null;
  }
}

export async function fetchMerchantSummary(
  merchantId: string,
  signal?: AbortSignal,
): Promise<MerchantSummary | null> {
  try {
    const r = await fetch(`${apiBase()}/merchants/${merchantId}/summary`, {
      signal,
    });
    if (!r.ok) return null;
    return (await r.json()) as MerchantSummary;
  } catch {
    return null;
  }
}
