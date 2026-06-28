// src/observability/observability.ts
// ULease OS U.M.M kernel · Observability primitives (roadmap layer 9).
//
// The portfolio was blind above the logs: no traces, no per-engine latency, no
// cost accounting. This module provides the SHARED, PURE primitives so every surface
// (leasing-api, Miame) emits the same spans, metrics and cost numbers.
//
// Purity is preserved by INJECTING the clock: the host passes timestamps (ms), so the
// kernel never calls Date.now(). Identical inputs ⇒ identical spans, so traces are
// testable and reproducible. The host wires a real clock + a real exporter (OTel,
// Datadog, console) around these types.
/** Latency of a finished span in ms (NaN if it was never ended). */
export function latencyMs(span) {
    return span.endedAt == null ? NaN : span.endedAt - span.startedAt;
}
/**
 * A deterministic, in-memory tracer. IDs are derived from an injected sequence (not a
 * random/uuid) so a given run always produces identical trace/span IDs — reproducible
 * in tests. The host can subclass/wrap to export spans to a real backend on end().
 */
export class InMemoryTracer {
    counters = {};
    prefix;
    finished = [];
    constructor(prefix = 'umm') {
        this.prefix = prefix;
    }
    nextId(kind) {
        const n = (this.counters[kind] ?? 0) + 1;
        this.counters[kind] = n;
        return `${this.prefix}-${kind}-${n}`;
    }
    startSpan(name, opts) {
        return {
            name,
            traceId: opts.traceId ?? this.nextId('trace'),
            spanId: this.nextId('span'),
            ...(opts.parentId !== undefined ? { parentId: opts.parentId } : {}),
            startedAt: opts.startedAt,
            status: 'ok',
            attributes: { ...opts.attributes },
        };
    }
    endSpan(span, opts) {
        span.endedAt = opts.endedAt;
        span.status = opts.status ?? 'ok';
        if (opts.attributes)
            Object.assign(span.attributes, opts.attributes);
        this.finished.push(span);
        return span;
    }
}
/** A minimal metrics sink the host can back with Prometheus/StatsD. */
export class InMemoryMetrics {
    metrics = [];
    record(metric) {
        this.metrics.push(metric);
    }
}
/**
 * Pricing table (USD / 1M tokens). PURE DATA, single source of truth for cost
 * estimation across the portfolio. Numbers are approximate published list prices and
 * host-overridable (pass a custom table to estimateCost) — keep them current here
 * rather than scattered per repo. Embedding models have no output tokens (→ 0).
 */
export const PRICING = {
    // Generation models.
    'gemini-1.5-flash': { inputPerMillion: 0.075, outputPerMillion: 0.3 },
    'claude-sonnet-4-6': { inputPerMillion: 3, outputPerMillion: 15 },
    'claude-haiku-4-5-20251001': { inputPerMillion: 0.8, outputPerMillion: 4 },
    // Embedding models (used by the RAG vector paths). Voyage is the live Miame provider;
    // text-embedding-004 is leasing-api's optional Gemini provider. Deterministic/lexical
    // embeddings are free (in-process) and intentionally absent → estimateCost = 0.
    'voyage-3.5': { inputPerMillion: 0.06, outputPerMillion: 0 },
    'voyage-3-large': { inputPerMillion: 0.18, outputPerMillion: 0 },
    'text-embedding-004': { inputPerMillion: 0.15, outputPerMillion: 0 },
    'voyage-embeddings': { inputPerMillion: 0.06, outputPerMillion: 0 }, // generic alias
};
/** Estimate the USD cost of a call from its token usage. Returns 0 for unknown models. */
export function estimateCost(usage, pricing = PRICING) {
    const p = pricing[usage.model];
    if (!p)
        return 0;
    return (usage.inputTokens * p.inputPerMillion + usage.outputTokens * p.outputPerMillion) / 1_000_000;
}
//# sourceMappingURL=observability.js.map