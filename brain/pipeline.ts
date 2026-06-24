// brain/pipeline.ts — the Demand-side lead pipeline (ULEASE_DEMAND_ENGINE in code).
//
// One inbound lead → score ∥ segment (Max/Haiku, in parallel) → grounded nurture draft
// (Master/Sonnet) → Guardian post-check. This is the decisioning core of the "deals
// campaign": the campaign *launch* is operational (n8n + ad budgets — see
// docs/MIAME_AGENT_STRATEGY.md); this module is what it calls per lead.
// SERVER-SIDE. Inbound-first by doctrine (תיקון 40): preCheck blocks unconsented
// outbound. `now` (ISO) is injected by the caller so the module stays pure/testable.
import { callModel } from "./client";
import { retrieve } from "./knowledge";
import { leadScorer, intentRouter } from "./max";
import { preCheck, postCheck, audit, redactPII } from "./guardian";
import type { Segment, GuardianVerdict, AuditEntry } from "./types";

export interface LeadInput {
  name?: string;
  phone?: string;
  message?: string;
  model?: string; // model configured in the simulator, if any
  monthly?: number; // configured monthly payment, if any
  source?: string; // web-form | whatsapp | simulator | ...
  channel?: string; // "outbound" requires consent:true
  consent?: boolean;
}

export type Priority = "hot" | "warm" | "cold";

export interface LeadOutcome {
  score: number; // 0..100 purchase-intent (Max)
  segment: Segment; // commuter | fleet | partner | unknown (Max)
  priority: Priority;
  nurture: string; // grounded, brand-voice nurture draft (Master), Guardian-checked
  grounded: boolean;
  guardian: GuardianVerdict;
  audit: AuditEntry[];
}

const NURTURE_SYSTEM =
  "אתה Nurture-Master של MiaMe (מנוע הביקוש). נסח הודעת המשך חמה, קצרה ואישית לליד נכנס " +
  "בקול המותג — בלי לחץ. בסס כל מספר/מפרט אך ורק על ההקשר המבוסס-מקור; אם חסר נתון אמור " +
  "שתחזרו אליו. סיים בהזמנה רכה להמשיך בוואטסאפ. 2-4 משפטים, עברית, בלי emoji מוגזם.";

function priorityOf(score: number): Priority {
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

function leadQuery(lead: LeadInput): string {
  const parts = [lead.message, lead.model, lead.monthly ? `${lead.monthly} לחודש` : ""]
    .filter(Boolean)
    .join(" ")
    .trim();
  return parts || "מיה פור מחיר טווח השכרה";
}

export async function processLead(lead: LeadInput, now: string): Promise<LeadOutcome> {
  const auditLog: AuditEntry[] = [];
  auditLog.push(audit("demand", "lead_received", now, { source: lead.source }));

  // Guardian gate: inbound-first. Outbound without explicit consent is blocked.
  const pre = preCheck({ payload: { channel: lead.channel, consent: lead.consent } });
  if (!pre.allowed) {
    auditLog.push(audit("guardian", "blocked:pre", now, { reasons: pre.reasons }));
    return {
      score: 0,
      segment: "unknown",
      priority: "cold",
      nurture: "",
      grounded: false,
      guardian: pre,
      audit: auditLog
    };
  }

  const message = (lead.message || "").trim();

  // Max workers (Haiku), in parallel: intent classification + purchase-intent score.
  const [segment, score] = await Promise.all([
    message ? intentRouter(message) : Promise.resolve<Segment>("unknown"),
    leadScorer({
      message,
      model: lead.model,
      monthly: lead.monthly,
      hasPhone: Boolean(lead.phone),
      source: lead.source
    })
  ]);

  // Master (Sonnet): a nurture draft grounded in retrieved facts.
  const docs = await retrieve(leadQuery(lead));
  const context = docs.map((d) => `[${d.source}] ${d.text}`).join("\n");
  const grounded = docs.length > 0;
  const draft = await callModel({
    tier: "master",
    system: `${NURTURE_SYSTEM}\n\nהקשר מבוסס-מקור:\n${context}`,
    user: message || `ליד חדש · דגם: ${lead.model || "—"} · סגמנט: ${segment}`
  });

  // Guardian post-check; never log raw PII.
  const post = postCheck(draft, { groundedFacts: grounded });
  const nurture = post.allowed ? draft : "";
  auditLog.push(
    audit("nurture", post.allowed ? "ok" : "blocked:post", now, {
      reasons: post.reasons,
      preview: redactPII(draft).slice(0, 120)
    })
  );

  return {
    score,
    segment,
    priority: priorityOf(score),
    nurture,
    grounded,
    guardian: post,
    audit: auditLog
  };
}
