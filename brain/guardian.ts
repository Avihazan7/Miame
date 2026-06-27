// brain/guardian.ts — the deterministic safety / compliance layer (ULEASE_SPEC §7.2).
//
// Guardian uses NO LLM: it is rule-based so it is auditable and non-bypassable.
// It enforces five invariants of the methodology:
//   1. Grounding   — no price/spec claim may ship without a retrieved source.
//   2. Consent     — outbound comms require explicit opt-in (תיקון 40: inbound-first).
//   3. PII safety  — phone/email are redacted from anything that gets logged.
//   4. Audit       — every agent action produces an immutable audit entry.
//   5. Input safety — adversarial prompt-injection is screened before any model call.
import type { AuditEntry, GuardianVerdict } from "./types";

// IL mobile/landline or email.
const PII = /(\b0\d{1,2}-?\d{6,7}\b)|([\w.+-]+@[\w-]+\.[\w.-]+)/g;
// Numeric price (₪) or spec units (km, km/h, Ah, W, V).
const NUMERIC_CLAIM = /₪\s?\d|\d+\s?ק"?מ|\d+\s?קמ"ש|\d+\s?Ah|\d+\s?W\b|\d+\s?V\b/;

// Prompt-injection signatures. /api/brain is a PUBLIC endpoint, so the raw visitor
// message is an attack surface: it is passed as the model `user` turn AND used as the
// RAG query. These patterns catch the common families (Hebrew + English) of attempts
// to override the system prompt, exfiltrate it, or hijack the agent role/format.
// Deterministic and conservative — it gates obvious attacks, it never paraphrases.
const INJECTION: { label: string; re: RegExp }[] = [
  // Override / ignore prior instructions.
  { label: "override-instructions", re: /\b(ignore|disregard|forget|override|bypass)\b[\s\S]{0,40}\b(previous|prior|above|earlier|all|any|the)\b[\s\S]{0,20}\b(instruction|prompt|rule|context|message)/i },
  { label: "override-instructions-he", re: /(התעלם|תתעלם|שכח|תשכח|עקוף|תעקוף|בטל|תבטל)[\s\S]{0,30}(הוראות|הנחיות|הוראה|הנחיה|הפרומפט|הכללים|ההקשר|מה שנאמר|הקודמ)/ },
  // Exfiltrate the system / developer prompt.
  { label: "system-prompt-exfil", re: /\b(reveal|show|print|repeat|expose|output|give me|what (is|are|was))\b[\s\S]{0,40}\b(system|developer|initial|original|your)\b[\s\S]{0,20}\b(prompt|instruction|message|rule|directive)/i },
  { label: "system-prompt-exfil-he", re: /(הצג|תציג|חשוף|תחשוף|הדפס|תדפיס|חזור על)[\s\S]{0,30}(פרומפט|הנחיות|הוראות|הוראה|הנחיה|הסיסטם|system)/ },
  // Role / persona hijack.
  { label: "role-hijack", re: /\b(you are now|act as|pretend to be|from now on|roleplay as|simulate (a|an|being))\b/i },
  { label: "role-hijack-he", re: /(אתה עכשיו|מעכשיו אתה|תתנהג כ|תעמיד פנים|שחק את התפקיד|תדמיין שאתה)/ },
  // Known jailbreak tokens / fake conversation delimiters.
  { label: "jailbreak-token", re: /\b(jailbreak|DAN mode|developer mode|do anything now|sudo mode|unfiltered)\b/i },
  { label: "delimiter-injection", re: /<\|?(im_start|im_end|system|endoftext)\|?>|(^|\n)\s*(system|assistant|developer)\s*:/i }
];

export function redactPII(text: string): string {
  return text.replace(PII, "‹redacted›");
}

/**
 * Input gate: screen a raw visitor message for prompt-injection BEFORE it reaches a
 * model or the RAG query. Returns a verdict; runBrain blocks the event when not allowed,
 * so an injection never produces a model call. Deterministic, auditable, non-bypassable.
 */
export function screenInput(text: string): GuardianVerdict {
  const reasons: string[] = [];
  if (typeof text === "string" && text.length > 0) {
    for (const sig of INJECTION) {
      if (sig.re.test(text)) reasons.push(`prompt-injection blocked: ${sig.label}`);
    }
  }
  return { allowed: reasons.length === 0, reasons };
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
