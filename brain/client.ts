// brain/client.ts — the brain's single model-call choke point.
//
// SERVER-SIDE ONLY. Never import this from a client component — it reads API
// keys from the environment. Intended to be called from an API route, an n8n
// function node, or a background worker.
//
// Since the P0 reliability pass, the actual HTTP work lives in brain/failover.ts:
// provider abstraction (Anthropic primary · optional OpenAI fallback), a hard
// per-call timeout, a basic circuit breaker, and structured secret-free logs.
// This module keeps the stable callModel() surface the pipeline/providers use.
import { brainReady } from "./config";
import { generateWithFailover } from "./failover";
import type { ModelTier } from "./types";

export interface ModelCall {
  tier: ModelTier;
  system: string;
  user: string;
  maxTokens?: number;
}

export async function callModel({ tier, system, user, maxTokens }: ModelCall): Promise<string> {
  if (!brainReady) {
    throw new Error("[brain] no AI provider configured — the brain is not configured.");
  }
  return generateWithFailover({ tier, system, user, maxTokens });
}
