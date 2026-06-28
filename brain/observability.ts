// brain/observability.ts — per-request observability (M2).
//
// A BrainObserver collects one trace per request: every model and embeddings call
// records a span (with an injected clock) and its cost (kernel estimateCost over the
// shared PRICING table). The "current" observer is propagated via AsyncLocalStorage, so
// providers record into the right request's trace WITHOUT threading a tracer through
// every function signature — and it is concurrency-safe across interleaved requests.
//
// SERVER-SIDE ONLY (node:async_hooks).
import { InMemoryTracer, estimateCost, latencyMs, type Span } from "@ulease/core";
import { AsyncLocalStorage } from "node:async_hooks";
import type { BrainTrace } from "./types";

export interface CallUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export class BrainObserver {
  private readonly tracer: InMemoryTracer;
  private costUsd = 0;

  constructor(
    private readonly clock: () => number = () => Date.now(),
    prefix = "miame-req"
  ) {
    this.tracer = new InMemoryTracer(prefix);
  }

  /** Open a span for a model/embeddings call. */
  startSpan(name: string, model: string): Span {
    return this.tracer.startSpan(name, { startedAt: this.clock(), attributes: { model } });
  }

  /** Close a span and accumulate its cost from token usage. */
  endSpan(span: Span, usage: CallUsage): void {
    this.tracer.endSpan(span, {
      endedAt: this.clock(),
      attributes: { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens }
    });
    this.costUsd += estimateCost(usage);
  }

  /** The request's trace summary (spans + total cost/latency). */
  trace(): BrainTrace {
    const spans = this.tracer.finished.map((s) => ({
      name: s.name,
      model: String(s.attributes["model"] ?? ""),
      latencyMs: Number.isNaN(latencyMs(s)) ? 0 : latencyMs(s)
    }));
    return {
      calls: spans.length,
      costUsd: Number(this.costUsd.toFixed(6)),
      latencyMs: spans.reduce((a, s) => a + s.latencyMs, 0),
      spans
    };
  }
}

const als = new AsyncLocalStorage<BrainObserver>();

/** Run `fn` with `observer` as the current request observer (concurrency-safe). */
export function runWithObserver<T>(observer: BrainObserver, fn: () => Promise<T>): Promise<T> {
  return als.run(observer, fn);
}

/** The observer for the in-flight request, if any (providers record into it). */
export function currentObserver(): BrainObserver | undefined {
  return als.getStore();
}
