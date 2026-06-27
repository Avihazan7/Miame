// brain/router.ts — the brain's Model/Agent Router (M3).
//
// One provider-agnostic entry point for every model call in the brain. Today Miame
// routes everything to Claude; swapping a tier to another provider is now a one-line
// policy change here instead of edits scattered across masters/max. The same router
// instance also accumulates observability (spans + cost) via its ClaudeProvider.
import { ModelRouter, type RoutingPolicy } from "@ulease/core";
import { ClaudeProvider, type BrainTelemetry } from "./provider";

const claude = new ClaudeProvider();

// reason → Master (Sonnet) · fast → Max (Haiku). embed is handled by the Voyage path
// (brain/embeddings) and kept here only so the policy type is complete.
const POLICY: RoutingPolicy = { reason: "claude", fast: "claude", embed: "claude" };

export const router = new ModelRouter({ claude }, POLICY);

/** Cumulative model telemetry for the brain process (calls, cost USD, latency ms). */
export function brainTelemetry(): BrainTelemetry {
  return claude.telemetry();
}
