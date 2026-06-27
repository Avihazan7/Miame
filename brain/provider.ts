// brain/provider.ts — the Claude ModelProvider for the shared @ulease/core router.
//
// Wraps the existing Anthropic client (./client) as a kernel ModelProvider so every
// brain call goes through ONE provider-agnostic surface (M3), and is traced + costed
// with the kernel observability primitives (M2). Behaviour is unchanged: the same
// Anthropic Messages call runs underneath; we only add routing + telemetry around it.
//
// SERVER-SIDE ONLY (it calls the model client). Date.now() is fine here — this is the
// host/consumer layer, not the pure kernel.
import {
  type ModelProvider,
  type GenerateRequest,
  type GenerateResult,
  InMemoryTracer,
  estimateCost,
  estimateTokens,
  latencyMs
} from "@ulease/core";
import { callModel } from "./client";
import { MODELS } from "./config";
import type { ModelTier } from "./types";

// Router task → model tier. reason = Master (Sonnet) deliberation; fast = Max (Haiku).
const TASK_TIER: Record<string, ModelTier> = { reason: "master", fast: "max", embed: "max" };

export interface BrainTelemetry {
  calls: number;
  totalCostUsd: number;
  totalLatencyMs: number;
}

export class ClaudeProvider implements ModelProvider {
  readonly name = "claude";
  readonly tracer = new InMemoryTracer("miame-brain");
  private costUsd = 0;

  // Clock is injected so the provider stays testable; defaults to wall-clock.
  constructor(private readonly clock: () => number = () => Date.now()) {}

  async generate(req: GenerateRequest): Promise<GenerateResult> {
    const tier = TASK_TIER[req.task ?? "reason"] ?? "master";
    const model = MODELS[tier];
    const span = this.tracer.startSpan(`model:${req.task ?? "reason"}`, {
      startedAt: this.clock(),
      attributes: { provider: this.name, model }
    });
    const text = await callModel({
      tier,
      system: req.system ?? "",
      user: req.user,
      ...(req.maxTokens !== undefined ? { maxTokens: req.maxTokens } : {})
    });
    const usage = {
      inputTokens: estimateTokens((req.system ?? "") + req.user),
      outputTokens: estimateTokens(text)
    };
    this.tracer.endSpan(span, {
      endedAt: this.clock(),
      attributes: { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens }
    });
    this.costUsd += estimateCost({ model, ...usage });
    return { text, model, provider: this.name, usage };
  }

  /** Cumulative process-level meter (calls, cost, latency) — surface for observability. */
  telemetry(): BrainTelemetry {
    const spans = this.tracer.finished;
    const totalLatencyMs = spans.reduce(
      (a, s) => a + (Number.isNaN(latencyMs(s)) ? 0 : latencyMs(s)),
      0
    );
    return { calls: spans.length, totalCostUsd: this.costUsd, totalLatencyMs };
  }
}
