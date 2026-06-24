// brain/client.ts — thin Anthropic Messages client (no SDK dependency; global fetch).
//
// SERVER-SIDE ONLY. Never import this from a client component — it reads the API
// key from the environment. Intended to be called from an API route, an n8n
// function node, or a background worker.
import {
  MODELS,
  ANTHROPIC_API_KEY,
  ANTHROPIC_BASE,
  ANTHROPIC_VERSION,
  MAX_OUTPUT_TOKENS,
  brainReady
} from "./config";
import type { ModelTier } from "./types";

export interface ModelCall {
  tier: ModelTier;
  system: string;
  user: string;
  maxTokens?: number;
}

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>;
}

export async function callModel({ tier, system, user, maxTokens }: ModelCall): Promise<string> {
  if (!brainReady) {
    throw new Error("[brain] ANTHROPIC_API_KEY not set — the brain is not configured.");
  }
  const res = await fetch(`${ANTHROPIC_BASE}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": ANTHROPIC_VERSION
    },
    body: JSON.stringify({
      model: MODELS[tier],
      max_tokens: maxTokens ?? MAX_OUTPUT_TOKENS,
      system,
      messages: [{ role: "user", content: user }]
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[brain] model call failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as AnthropicResponse;
  return (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text || "")
    .join("")
    .trim();
}
