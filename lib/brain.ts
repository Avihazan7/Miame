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

// ── 2026 catalog (models + Master Match) ─────────────────────────────────────
// The dedicated catalog domain (catalog_models): brands-and-models with the
// official government data (safety/pollution/importer) + segment. Distinct from
// getCatalog() above, which is the VIN-keyed read model.

/** Raw catalog model as the brain serves it (snake_case). */
export interface CatalogModelApi {
  id: string;
  make: string;
  make_he: string | null;
  model_family: string;
  name: string;
  fuel_type: string | null;
  from_price: string | number | null;
  available_new: boolean;
  segment: string | null;
  attributes: Record<string, unknown> | null;
  image_url?: string | null;
  media?: { studio?: string | null } | null;
}

export interface CatalogModelsResponse {
  tenant: string;
  count: number;
  models: CatalogModelApi[];
}

/** List the 2026 catalog models, optionally filtered by make. */
export function getCatalogModels(make?: string): Promise<CatalogModelsResponse | null> {
  const q = make ? `?make=${encodeURIComponent(make)}` : "";
  return call<CatalogModelsResponse>(`/v1/public/catalog/models${q}`, { method: "GET" });
}

// ── Model detail (the standalone model page) ─────────────────────────────────
// One model's full record: government data + imagery + trims (each with its
// official MoT code), plus the live "available for a deal" window — the
// supplier/importer offers matched to THIS model by its degem code. The public
// (private-audience) endpoint returns only B2C-eligible offers; B2B/partner are
// gated behind the authenticated tier.

/** A trim row on the model page — carries its official MoT model code. */
export interface TrimApi {
  id: string;
  trim: string | null;
  modelYear: number | null;
  listPrice: number;
  fuelType: string | null;
  attributes: Record<string, unknown> | null;
  motTozeretCd: number | null;
  motDegemCd: number | null;
}

/** One supplier/importer offer matched to the model (the available window). */
export interface OfferApi {
  vin: string;
  trim: string | null;
  modelYear: number | null;
  fuelType: string | null;
  listPrice: number | null;
  offerPrice: number | null;
  dealScore: number | null;
  registration: { year: number; month: number } | null;
  zeroKm: { price: number; ageMonths: number } | null;
  salesChannel: string;
  salesChannelLabel: string;
}

export interface ModelDetailApi {
  model: {
    id: string;
    make: string;
    makeHe: string | null;
    modelFamily: string;
    name: string;
    bodyType: string | null;
    fuelType: string | null;
    fromPrice: number | null;
    motTozeretCd: number | null;
    motDegemCd: number | null;
    availableNew: boolean;
    attributes: Record<string, unknown> | null;
    segment: string | null;
  };
  media?: { studio?: string | null } | null;
  trims: TrimApi[];
  available: OfferApi[];
  availableCount: number;
}

/** Fetch one model's full detail by catalog id (e.g. "mot-toyota-corolla"). */
export function getModelDetail(id: string): Promise<ModelDetailApi | null> {
  return call<ModelDetailApi>(`/v1/public/catalog/models/${encodeURIComponent(id)}`, { method: "GET" });
}

/** One ranked Master-Match result. */
export interface ModelMatchApi {
  id: string;
  make: string;
  makeHe: string | null;
  name: string;
  fromPrice: number | null;
  segment: string | null;
  fit: number;
  recommendedTrack: string;
  reason: string | null;
  media?: { studio?: string | null } | null;
}

export interface InMarketApi {
  score: number;
  band: "cold" | "browsing" | "warm" | "hot" | "in_market";
  nextBestAction: string;
  insight: string;
}

export interface MatchResponse {
  tenant: string;
  match: ModelMatchApi | null;
  top: ModelMatchApi[];
  inMarket: InMarketApi | null;
}

/** Master Match — the best-fit model for a visitor (by ref → stored Big Five). */
export function matchModel(body: { ref?: string; bigfive?: Record<string, number>; make?: string }): Promise<MatchResponse | null> {
  return call<MatchResponse>("/v1/public/catalog/match", { method: "POST", body: JSON.stringify(body) });
}
