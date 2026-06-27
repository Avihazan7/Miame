/** What the caller wants done — the router maps this to a concrete provider. */
export type Task = 'reason' | 'fast' | 'embed';
export interface GenerateRequest {
    user: string;
    system?: string;
    task?: Task;
    model?: string;
    maxTokens?: number;
    temperature?: number;
}
export interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
}
export interface GenerateResult {
    text: string;
    model: string;
    provider: string;
    usage?: TokenUsage;
}
/** A model provider. Implemented per-consumer (Gemini, Claude, …) and injected. */
export interface ModelProvider {
    readonly name: string;
    generate(req: GenerateRequest): Promise<GenerateResult>;
    embed?(texts: string[]): Promise<number[][]>;
}
/** Maps a task to the provider name that should serve it. Pure data. */
export type RoutingPolicy = Record<Task, string>;
export declare class ProviderNotFoundError extends Error {
    constructor(name: string, task: Task);
}
/**
 * Routes requests to providers by task. Selection is pure and independently testable
 * (`selectProviderName`); only `generate`/`embed` are async, delegating to the injected
 * provider. Wrap with the observability primitives in the host to trace + cost each call.
 */
export declare class ModelRouter {
    private readonly providers;
    private readonly policy;
    constructor(providers: Record<string, ModelProvider>, policy: RoutingPolicy);
    /** Pure: which provider name serves this request (explicit task or 'reason' default). */
    selectProviderName(req: GenerateRequest): string;
    private resolve;
    generate(req: GenerateRequest): Promise<GenerateResult>;
    embed(texts: string[], provider: string): Promise<number[][]>;
}
/** Rough token estimate (≈ 4 chars/token). Deterministic; for cost/eval accounting only. */
export declare function estimateTokens(text: string): number;
/**
 * A deterministic mock provider for tests and offline runs. No I/O, no clock, no
 * randomness: identical inputs ⇒ identical output, so router behaviour is reproducible.
 */
export declare class DeterministicMockProvider implements ModelProvider {
    readonly name: string;
    constructor(name?: string);
    generate(req: GenerateRequest): Promise<GenerateResult>;
    embed(texts: string[]): Promise<number[][]>;
}
//# sourceMappingURL=router.d.ts.map