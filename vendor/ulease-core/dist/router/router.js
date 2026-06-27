// src/router/router.ts
// ULease OS U.M.M kernel · Model/Agent Router (the M3 unification).
//
// The portfolio is multi-provider by accident: leasing-api narrates with Gemini, Miame
// reasons with Claude, with no shared abstraction. This module defines ONE provider-
// agnostic surface so any surface can route a request to the right model by TASK, and
// swap providers in config rather than in code.
//
// The kernel stays pure: it defines the interface + a deterministic mock + the (pure)
// routing-selection logic. REAL providers (Gemini, Claude SDK clients) are implemented
// in the consumer and injected — the kernel never imports an SDK or calls the network.
export class ProviderNotFoundError extends Error {
    constructor(name, task) {
        super(`no provider "${name}" registered for task "${task}"`);
        this.name = 'ProviderNotFoundError';
    }
}
/**
 * Routes requests to providers by task. Selection is pure and independently testable
 * (`selectProviderName`); only `generate`/`embed` are async, delegating to the injected
 * provider. Wrap with the observability primitives in the host to trace + cost each call.
 */
export class ModelRouter {
    providers;
    policy;
    constructor(providers, policy) {
        this.providers = providers;
        this.policy = policy;
    }
    /** Pure: which provider name serves this request (explicit task or 'reason' default). */
    selectProviderName(req) {
        const task = req.task ?? 'reason';
        return this.policy[task];
    }
    resolve(req) {
        const task = req.task ?? 'reason';
        const name = this.policy[task];
        const provider = this.providers[name];
        if (!provider)
            throw new ProviderNotFoundError(name, task);
        return provider;
    }
    async generate(req) {
        return this.resolve(req).generate(req);
    }
    async embed(texts, provider) {
        const p = this.providers[provider];
        if (!p || !p.embed)
            throw new ProviderNotFoundError(provider, 'embed');
        return p.embed(texts);
    }
}
/** Rough token estimate (≈ 4 chars/token). Deterministic; for cost/eval accounting only. */
export function estimateTokens(text) {
    return Math.ceil((text ?? '').length / 4);
}
/**
 * A deterministic mock provider for tests and offline runs. No I/O, no clock, no
 * randomness: identical inputs ⇒ identical output, so router behaviour is reproducible.
 */
export class DeterministicMockProvider {
    name;
    constructor(name = 'mock') {
        this.name = name;
    }
    generate(req) {
        const model = req.model ?? `${this.name}-model`;
        const text = `[${this.name}] ${req.user}`;
        const usage = {
            inputTokens: estimateTokens((req.system ?? '') + req.user),
            outputTokens: estimateTokens(text),
        };
        return Promise.resolve({ text, model, provider: this.name, usage });
    }
    embed(texts) {
        // Deterministic lexical hash → fixed-width vector (good enough for offline tests).
        const dim = 8;
        return Promise.resolve(texts.map((t) => {
            const v = new Array(dim).fill(0);
            for (let i = 0; i < t.length; i++) {
                const idx = t.charCodeAt(i) % dim;
                v[idx] = (v[idx] ?? 0) + 1;
            }
            return v;
        }));
    }
}
//# sourceMappingURL=router.js.map