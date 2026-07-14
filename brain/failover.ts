// brain/failover.ts — provider abstraction + failover for the U.M.M brain.
//
// WHY (P0 reliability): production logged `/api/brain` failures with
// "Anthropic API credit balance is too low" — a single-provider brain is a
// single point of failure. This module gives callModel():
//   · a configurable PRIMARY provider (AI_PRIMARY_PROVIDER, default "anthropic")
//   · an optional FALLBACK provider (AI_FALLBACK_PROVIDER, e.g. "openai") that is
//     used ONLY when its API key is actually present (never a blind switch)
//   · a hard per-call timeout (BRAIN_TIMEOUT_MS, default 30s, AbortController)
//   · a basic per-provider circuit breaker (3 consecutive failures → open for
//     60s → half-open probe), so a dead provider stops eating latency
//   · structured JSON logs ({"evt":"brain.call",...}) with no secrets and no
//     raw vendor error text
//
// SERVER-SIDE ONLY. Vendor error bodies never leave this module — callers get
// a generic Error; the route already maps that to a friendly Hebrew-safe 503.
import {
  MODELS,
  OPENAI_MODELS,
  ANTHROPIC_API_KEY,
  ANTHROPIC_BASE,
  ANTHROPIC_VERSION,
  OPENAI_API_KEY,
  OPENAI_BASE,
  AI_PRIMARY_PROVIDER,
  AI_FALLBACK_PROVIDER,
  BRAIN_TIMEOUT_MS,
  MAX_OUTPUT_TOKENS
} from "./config";
import type { ModelTier } from "./types";

export type ProviderName = "anthropic" | "openai";

export interface GenerateCall {
  tier: ModelTier;
  system: string;
  user: string;
  maxTokens?: number;
}

// ── circuit breaker (per provider, per serverless instance — "basic" by design) ──
const FAILURE_THRESHOLD = 3;
const OPEN_MS = 60_000;

interface Circuit {
  consecutiveFailures: number;
  openedAt: number | null;
}
const circuits: Record<ProviderName, Circuit> = {
  anthropic: { consecutiveFailures: 0, openedAt: null },
  openai: { consecutiveFailures: 0, openedAt: null }
};

export function circuitState(p: ProviderName): "closed" | "open" | "half-open" {
  const c = circuits[p];
  if (c.openedAt == null) return "closed";
  return Date.now() - c.openedAt >= OPEN_MS ? "half-open" : "open";
}

function recordSuccess(p: ProviderName) {
  circuits[p] = { consecutiveFailures: 0, openedAt: null };
}

function recordFailure(p: ProviderName) {
  const c = circuits[p];
  c.consecutiveFailures += 1;
  if (c.consecutiveFailures >= FAILURE_THRESHOLD && c.openedAt == null) {
    c.openedAt = Date.now();
  } else if (c.openedAt != null) {
    c.openedAt = Date.now(); // failed half-open probe → re-open the window
  }
}

/** Test hook — resets breaker state between test cases. */
export function resetCircuits(): void {
  circuits.anthropic = { consecutiveFailures: 0, openedAt: null };
  circuits.openai = { consecutiveFailures: 0, openedAt: null };
}

// ── provider adapters (fetch-only, no SDKs — matches the repo doctrine) ────────
class ProviderError extends Error {
  constructor(
    public provider: ProviderName,
    public status: number | "timeout" | "network",
    detail: string
  ) {
    // Detail stays server-side (this Error is logged, never serialized to clients).
    super(`[brain:${provider}] call failed (${status}): ${detail.slice(0, 300)}`);
  }
  /** 4xx request bugs (except 408/429) will fail on any provider — don't fail over. */
  get retriable(): boolean {
    if (this.status === "timeout" || this.status === "network") return true;
    return this.status === 408 || this.status === 429 || this.status >= 500;
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, provider: ProviderName): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), BRAIN_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (e) {
    const timedOut = e instanceof Error && e.name === "AbortError";
    throw new ProviderError(provider, timedOut ? "timeout" : "network", e instanceof Error ? e.message : String(e));
  } finally {
    clearTimeout(timer);
  }
}

async function callAnthropic(call: GenerateCall): Promise<string> {
  const res = await fetchWithTimeout(
    `${ANTHROPIC_BASE}/v1/messages`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_VERSION
      },
      body: JSON.stringify({
        model: MODELS[call.tier],
        max_tokens: call.maxTokens ?? MAX_OUTPUT_TOKENS,
        system: call.system,
        messages: [{ role: "user", content: call.user }]
      })
    },
    "anthropic"
  );
  if (!res.ok) throw new ProviderError("anthropic", res.status, await res.text());
  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  return (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text || "")
    .join("")
    .trim();
}

async function callOpenAI(call: GenerateCall): Promise<string> {
  const res = await fetchWithTimeout(
    `${OPENAI_BASE}/v1/chat/completions`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODELS[call.tier],
        max_tokens: call.maxTokens ?? MAX_OUTPUT_TOKENS,
        messages: [
          { role: "system", content: call.system },
          { role: "user", content: call.user }
        ]
      })
    },
    "openai"
  );
  if (!res.ok) throw new ProviderError("openai", res.status, await res.text());
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return (data.choices?.[0]?.message?.content || "").trim();
}

const ADAPTERS: Record<ProviderName, (c: GenerateCall) => Promise<string>> = {
  anthropic: callAnthropic,
  openai: callOpenAI
};

export function providerConfigured(p: ProviderName): boolean {
  return p === "anthropic" ? Boolean(ANTHROPIC_API_KEY) : Boolean(OPENAI_API_KEY);
}

/** The failover chain: primary first, fallback second — keys verified, no dupes. */
export function providerChain(): ProviderName[] {
  const chain: ProviderName[] = [];
  for (const p of [AI_PRIMARY_PROVIDER, AI_FALLBACK_PROVIDER]) {
    if ((p === "anthropic" || p === "openai") && providerConfigured(p) && !chain.includes(p)) {
      chain.push(p);
    }
  }
  return chain;
}

function logCall(fields: Record<string, unknown>) {
  // Structured, single-line, secret-free. Vendor error text intentionally excluded.
  console.log(JSON.stringify({ evt: "brain.call", ts: new Date().toISOString(), ...fields }));
}

/**
 * Generate text with timeout + circuit breaker + provider failover.
 * Throws a generic Error (no vendor detail) when every provider is exhausted.
 */
export async function generateWithFailover(call: GenerateCall): Promise<string> {
  const chain = providerChain();
  if (chain.length === 0) {
    throw new Error("[brain] no AI provider configured — set ANTHROPIC_API_KEY (or a verified fallback).");
  }

  let lastRetriable = true;
  for (const provider of chain) {
    const state = circuitState(provider);
    if (state === "open") {
      logCall({ provider, tier: call.tier, skipped: "circuit-open" });
      continue;
    }
    const started = Date.now();
    try {
      const text = await ADAPTERS[provider](call);
      recordSuccess(provider);
      logCall({ provider, tier: call.tier, ok: true, ms: Date.now() - started, circuit: "closed" });
      return text;
    } catch (e) {
      const pe = e instanceof ProviderError ? e : new ProviderError(provider, "network", String(e));
      recordFailure(provider);
      lastRetriable = pe.retriable;
      logCall({
        provider,
        tier: call.tier,
        ok: false,
        ms: Date.now() - started,
        status: pe.status,
        retriable: pe.retriable,
        circuit: circuitState(provider)
      });
      // Full detail (may contain billing/account text) → server log only.
      console.error(pe.message);
      if (!pe.retriable) break; // a request bug won't succeed elsewhere
    }
  }
  throw new Error(
    lastRetriable
      ? "[brain] all AI providers unavailable right now."
      : "[brain] the request was rejected by the AI provider."
  );
}

/** Health snapshot for GET /api/brain — no secrets, just readiness + breaker state. */
export function providersHealth() {
  return {
    primary: {
      name: AI_PRIMARY_PROVIDER,
      configured: providerConfigured(AI_PRIMARY_PROVIDER as ProviderName),
      circuit: circuitState(AI_PRIMARY_PROVIDER as ProviderName)
    },
    fallback: AI_FALLBACK_PROVIDER
      ? {
          name: AI_FALLBACK_PROVIDER,
          configured: providerConfigured(AI_FALLBACK_PROVIDER as ProviderName),
          circuit: circuitState(AI_FALLBACK_PROVIDER as ProviderName)
        }
      : null,
    timeoutMs: BRAIN_TIMEOUT_MS
  };
}
