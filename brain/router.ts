// brain/router.ts — the brain's Model/Agent Router (M3).
//
// One provider-agnostic entry point for every model AND embeddings call in the brain.
// Today reason/fast route to Claude and embeddings route to Voyage; swapping a tier to
// another provider is a one-line policy change here. The providers also accumulate
// observability (spans + cost) into the current request's observer (M2).
import { ModelRouter, type RoutingPolicy } from "@ulease/core";
import { ClaudeProvider, VoyageProvider, type ProviderMeter } from "./provider";

const claude = new ClaudeProvider();
const voyage = new VoyageProvider();

// reason → Master (Sonnet) · fast → Max (Haiku) · embed → Voyage (1024-d vectors).
const POLICY: RoutingPolicy = { reason: "claude", fast: "claude", embed: "voyage" };

export const router = new ModelRouter({ claude, voyage }, POLICY);

/** Embed a single query through the router (the RAG vector path). */
export async function embedQueryVia(text: string): Promise<number[]> {
  const [vector] = await router.embed([text], "voyage");
  return vector ?? [];
}

/** Cumulative model+embeddings telemetry for the brain process (calls, cost, latency). */
export function brainTelemetry(): ProviderMeter {
  const c = claude.telemetry();
  const v = voyage.telemetry();
  return {
    calls: c.calls + v.calls,
    costUsd: c.costUsd + v.costUsd,
    latencyMs: c.latencyMs + v.latencyMs
  };
}
