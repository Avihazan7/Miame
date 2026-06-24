// brain/guardian.ts — the deterministic safety / compliance layer (ULEASE_SPEC §7.2).
//
// Guardian uses NO LLM: it is rule-based so it is auditable and non-bypassable.
// It enforces four invariants of the methodology:
//   1. Grounding   — no price/spec claim may ship without a retrieved source.
//   2. Consent     — outbound comms require explicit opt-in (תיקון 40: inbound-first).
//   3. PII safety  — phone/email are redacted from anything that gets logged.
//   4. Audit       — every agent action produces an immutable audit entry.
import type { AuditEntry, GuardianVerdict } from "./types";

// IL mobile/landline or email.
const PII = /(\b0\d{1,2}-?\d{6,7}\b)|([\w.+-]+@[\w-]+\.[\w.-]+)/g;
// Numeric price (₪) or spec units (km, km/h, Ah, W, V).
const NUMERIC_CLAIM = /₪\s?\d|\d+\s?ק"?מ|\d+\s?קמ"ש|\d+\s?Ah|\d+\s?W\b|\d+\s?V\b/;

export function redactPII(text: string): string {
  return text.replace(PII, "‹redacted›");
}

/** Pre-flight: may the brain act on this event at all? */
export function preCheck(event: { payload: Record<string, unknown> }): GuardianVerdict {
  const reasons: string[] = [];
  const isOutbound = event.payload["channel"] === "outbound";
  if (isOutbound && event.payload["consent"] !== true) {
    reasons.push("outbound blocked: no explicit consent (תיקון 40 — inbound only)");
  }
  return { allowed: reasons.length === 0, reasons };
}

/** Post-flight: is an agent's text output safe to surface to a customer? */
export function postCheck(output: string, opts: { groundedFacts: boolean }): GuardianVerdict {
  const reasons: string[] = [];
  const redactions: string[] = [];
  if (NUMERIC_CLAIM.test(output) && !opts.groundedFacts) {
    reasons.push("ungrounded numeric claim (price/spec) — block until RAG-sourced");
  }
  if (redactPII(output) !== output) redactions.push("PII");
  return { allowed: reasons.length === 0, reasons, redactions };
}

export function audit(
  actor: string,
  action: string,
  at: string,
  meta?: Record<string, unknown>
): AuditEntry {
  return { at, actor, action, meta };
}
