// lib/brain.ts — SERVER-ONLY client for the U.M.M central brain (leasing-api).
//
// MiaMe talks to the central brain over HTTP as the `miame` tenant. The tenant is
// resolved by the brain from the forwarded Host (miame.co.il) — never a
// client-asserted id — and an optional write-tier key authenticates the
// authenticated tier. NEVER import this from a client component: it would leak the
// key into the browser bundle. Every call fails SOFT (timeout → null) so the
// storefront funnel (WhatsApp + Supabase) never breaks when the brain is
// unreachable or unconfigured.

const BASE = (process.env.LEASING_API_URL || "").replace(/\/$/, "");
const TENANT_HOST = process.env.MIAME_TENANT_HOST || "miame.co.il";
const API_KEY = process.env.MIAME_TENANT_API_KEY || "";
const TIMEOUT_MS = Number(process.env.LEASING_API_TIMEOUT_MS || 4000);

/** True when a central-brain base URL is configured; gates all calls. */
export const brainConfigured = Boolean(BASE);

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = {
    "content-type": "application/json",
    // Host-based tenant routing — the brain maps this to the miame tenant. The
    // brain honours X-Forwarded-Host ahead of Host (it sits behind a proxy too).
    "x-forwarded-host": TENANT_HOST,
    ...extra,
  };
  if (API_KEY) h["authorization"] = `Bearer ${API_KEY}`;
  return h;
}

async function call<T>(path: string, init: RequestInit & { headers?: Record<string, string> }): Promise<T | null> {
  if (!BASE) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: headers(init.headers),
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export type Grade = "A" | "B" | "C" | "D";

/** The sealed Deal Score — headline only. The brain never sends weights/breakdown. */
export interface SealedScore {
  score: number;
  grade: Grade;
  reasons: string[];
}

export interface LeadResult {
  ok: boolean;
  leadId: string;
  score: SealedScore;
}

export interface LeadPayload {
  ref: string;
  model: string;
  customerType: "private" | "business" | "partner";
  quote: {
    basePrice: number;
    effectivePrice: number;
    downAmount: number;
    balloonAmount: number;
    monthlyPayment: number;
    months: number;
  };
  contact?: { name?: string; phone?: string };
}

/** Persist a submitted simulator deal in the central brain; returns the sealed score. */
export function postLead(payload: LeadPayload, idempotencyKey?: string): Promise<LeadResult | null> {
  return call<LeadResult>("/v1/public/lead", {
    method: "POST",
    headers: idempotencyKey ? { "idempotency-key": idempotencyKey } : {},
    body: JSON.stringify(payload),
  });
}

/** Nudge the visitor's Big Five from a known interaction signal (best-effort). */
export function postSignal(ref: string, signal: string, vin?: string): Promise<unknown | null> {
  return call("/v1/public/signal", {
    method: "POST",
    body: JSON.stringify(vin ? { ref, signal, vin } : { ref, signal }),
  });
}

export interface CatalogResponse {
  tenant: string;
  count: number;
  vehicles: unknown[];
}

/** Read the miame-scoped storefront catalog from the central read model. */
export function getCatalog(): Promise<CatalogResponse | null> {
  return call<CatalogResponse>("/v1/public/catalog", { method: "GET" });
}
