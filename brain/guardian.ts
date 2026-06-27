// brain/guardian.ts — re-export shim.
//
// The deterministic safety / compliance layer now lives in the shared kernel
// @ulease/core (single source of truth across leasing-api + Miame), so the rule-based
// Guardian can never drift between repos. This file preserves the existing import path
// (./guardian) for the rest of the brain module; behaviour is byte-identical.
//
// Invariants enforced by the kernel Guardian: grounding, consent (תיקון 40), PII
// redaction, audit, and prompt-injection input screening.
export { redactPII, screenInput, preCheck, postCheck, audit } from "@ulease/core";
export type { GuardianVerdict, AuditEntry } from "@ulease/core";
