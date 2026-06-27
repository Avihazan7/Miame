export interface GuardianVerdict {
    allowed: boolean;
    reasons: string[];
    redactions?: string[];
}
export interface AuditEntry {
    at: string;
    actor: string;
    action: string;
    meta?: Record<string, unknown>;
}
export declare function redactPII(text: string): string;
/**
 * Input gate: screen a raw visitor message for prompt-injection BEFORE it reaches a
 * model or the RAG query. Returns a verdict; callers must block the event when not
 * allowed, so an injection never produces a model call. Deterministic, non-bypassable.
 */
export declare function screenInput(text: string): GuardianVerdict;
/** Pre-flight: may the brain act on this event at all? (consent / תיקון 40). */
export declare function preCheck(event: {
    payload: Record<string, unknown>;
}): GuardianVerdict;
/** Post-flight: is an agent's text output safe to surface to a customer? (grounding + PII). */
export declare function postCheck(output: string, opts: {
    groundedFacts: boolean;
}): GuardianVerdict;
/** Build an immutable audit entry. `at` (ISO timestamp) is injected to keep this pure. */
export declare function audit(actor: string, action: string, at: string, meta?: Record<string, unknown>): AuditEntry;
//# sourceMappingURL=guardian.d.ts.map