// brain/provider.ts — the model + embeddings providers for the @ulease/core router.
//
// Both wrap the existing brain clients as kernel ModelProviders (M3) so every model and
// embeddings call goes through ONE provider-agnostic surface, and each records a span +
// cost into the current request's observer (M2) plus a cumulative process meter.
// Behaviour is unchanged: the same Anthropic / Voyage calls run underneath.
//
// SERVER-SIDE ONLY. Date.now() is fine here — consumer layer, not the pure kernel.
import {
  type ModelProvider,
  type GenerateRequest,
  type GenerateResult,
  estimateCost,
  estimateTokens
} from "@ulease/core";
import { callModel } from "./client";
import { embedQuery } from "./embeddings";
import { MODELS, EMBED_MODEL } from "./config";
import type { ModelTier } from "./types";
import { currentObserver } from "./observability";

// Router task → model tier. reason = Master (Sonnet) deliberation; fast = Max (Haiku).
const TASK_TIER: Record<string, ModelTier> = { reason: "master", fast: "max", embed: "max" };

export interface ProviderMeter {
  calls: number;
  costUsd: number;
  latencyMs: number;
}

export class ClaudeProvider implements ModelProvider {
  readonly name = "claude";
  private meter: ProviderMeter = { calls: 0, costUsd: 0, latencyMs: 0 };

  constructor(private readonly clock: () => number = () => Date.now()) {}

  async generate(req: GenerateRequest): Promise<GenerateResult> {
    const tier = TASK_TIER[req.task ?? "reason"] ?? "master";
    const model = MODELS[tier];
    const obs = currentObserver();
    const span = obs?.startSpan(`model:${req.task ?? "reason"}`, model);

    const t0 = this.clock();
    const text = await callModel({
      tier,
      system: req.system ?? "",
      user: req.user,
      ...(req.maxTokens !== undefined ? { maxTokens: req.maxTokens } : {})
    });
    const t1 = this.clock();

    const usage = {
      inputTokens: estimateTokens((req.system ?? "") + req.user),
      outputTokens: estimateTokens(text)
    };
    this.meter.calls += 1;
    this.meter.costUsd += estimateCost({ model, ...usage });
    this.meter.latencyMs += t1 - t0;
    if (obs && span) obs.endSpan(span, { model, ...usage });

    return { text, model, provider: this.name, usage };
  }

  telemetry(): ProviderMeter {
    return { ...this.meter };
  }
}

/**
 * Embeddings-only provider (Voyage). generate() is unsupported by design — the router
 * only routes the `embed` task here; reason/fast go to Claude.
 */
export class VoyageProvider implements ModelProvider {
  readonly name = "voyage";
  private meter: ProviderMeter = { calls: 0, costUsd: 0, latencyMs: 0 };

  constructor(private readonly clock: () => number = () => Date.now()) {}

  generate(): Promise<GenerateResult> {
    return Promise.reject(new Error("[brain] voyage is an embeddings-only provider"));
  }

  async embed(texts: string[]): Promise<number[][]> {
    const obs = currentObserver();
    const span = obs?.startSpan("embed", EMBED_MODEL);

    const t0 = this.clock();
    const vectors = await Promise.all(texts.map((t) => embedQuery(t)));
    const t1 = this.clock();

    const usage = {
      model: EMBED_MODEL, // the real Voyage model id — priced in the kernel PRICING table
      inputTokens: texts.reduce((a, t) => a + estimateTokens(t), 0),
      outputTokens: 0
    };
    this.meter.calls += 1;
    this.meter.costUsd += estimateCost(usage);
    this.meter.latencyMs += t1 - t0;
    if (obs && span) obs.endSpan(span, usage);

    return vectors;
  }

  telemetry(): ProviderMeter {
    return { ...this.meter };
  }
}
