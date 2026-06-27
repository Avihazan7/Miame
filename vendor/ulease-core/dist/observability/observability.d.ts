export type SpanStatus = 'ok' | 'error';
export interface Span {
    name: string;
    traceId: string;
    spanId: string;
    parentId?: string;
    startedAt: number;
    endedAt?: number;
    status: SpanStatus;
    attributes: Record<string, string | number | boolean>;
}
export interface StartSpanOptions {
    startedAt: number;
    traceId?: string;
    parentId?: string;
    attributes?: Record<string, string | number | boolean>;
}
export interface EndSpanOptions {
    endedAt: number;
    status?: SpanStatus;
    attributes?: Record<string, string | number | boolean>;
}
/** Latency of a finished span in ms (NaN if it was never ended). */
export declare function latencyMs(span: Span): number;
/**
 * A deterministic, in-memory tracer. IDs are derived from an injected sequence (not a
 * random/uuid) so a given run always produces identical trace/span IDs — reproducible
 * in tests. The host can subclass/wrap to export spans to a real backend on end().
 */
export declare class InMemoryTracer {
    private readonly counters;
    private readonly prefix;
    readonly finished: Span[];
    constructor(prefix?: string);
    private nextId;
    startSpan(name: string, opts: StartSpanOptions): Span;
    endSpan(span: Span, opts: EndSpanOptions): Span;
}
export interface Metric {
    name: string;
    value: number;
    unit: 'ms' | 'count' | 'usd' | 'tokens';
    attributes?: Record<string, string | number | boolean>;
}
/** A minimal metrics sink the host can back with Prometheus/StatsD. */
export declare class InMemoryMetrics {
    readonly metrics: Metric[];
    record(metric: Metric): void;
}
export interface ModelPricing {
    inputPerMillion: number;
    outputPerMillion: number;
}
/**
 * Illustrative pricing table (USD / 1M tokens). PURE DATA, single source of truth for
 * cost estimation across the portfolio. Numbers are approximate and host-overridable —
 * keep them current in one place rather than scattered per repo.
 */
export declare const PRICING: Record<string, ModelPricing>;
export interface Usage {
    model: string;
    inputTokens: number;
    outputTokens: number;
}
/** Estimate the USD cost of a call from its token usage. Returns 0 for unknown models. */
export declare function estimateCost(usage: Usage, pricing?: Record<string, ModelPricing>): number;
//# sourceMappingURL=observability.d.ts.map