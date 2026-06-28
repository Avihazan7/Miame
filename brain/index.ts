// brain/index.ts — runBrain(): the U.M.M pipeline entry point.
//
//   Guardian.preCheck → Ultra.route → Guardian.screenInput → Master(s) run (grounded) → Guardian.postCheck → audit
//
// Returns a fully-traced BrainResult. SERVER-SIDE: call from a Next.js API route, an
// n8n function node, or a worker. Nothing here is imported by the MiaMe site, so it
// can never affect the public bundle or build output.
//
// `now` (ISO timestamp) is injected by the caller so this module stays pure/testable.
import { preCheck, postCheck, screenInput, audit } from "./guardian";
import { route } from "./ultra";
import { runMaster } from "./masters";
import { BrainObserver, runWithObserver } from "./observability";
import type { BrainEvent, BrainResult, AgentResult, AuditEntry, GuardianVerdict } from "./types";

export async function runBrain(event: BrainEvent, now: string): Promise<BrainResult> {
  // One observer per request collects spans + cost for every model/embeddings call
  // (M2). Providers find it via AsyncLocalStorage, so nothing else needs threading.
  const observer = new BrainObserver();
  return runWithObserver(observer, async () => {
    const auditLog: AuditEntry[] = [];
    auditLog.push(audit("ultra", `received:${event.type}`, now, { source: event.source }));

    const pre = preCheck(event);
    if (!pre.allowed) {
      auditLog.push(audit("guardian", "blocked:pre", now, { reasons: pre.reasons }));
      return { event, routed: [], results: [], verdict: pre, audit: auditLog };
    }

    const masters = route(event.type);
    auditLog.push(audit("ultra", "routed", now, { masters }));

    const input =
      typeof event.payload["message"] === "string"
        ? (event.payload["message"] as string)
        : JSON.stringify(event.payload);

    // Input safety: screen the raw visitor message for prompt-injection BEFORE any model
    // call or RAG query. /api/brain is public, so this is the first untrusted boundary.
    const screen = screenInput(input);
    if (!screen.allowed) {
      auditLog.push(audit("guardian", "blocked:input", now, { reasons: screen.reasons }));
      return { event, routed: masters, results: [], verdict: screen, audit: auditLog };
    }

    const results: AgentResult[] = [];
    for (const m of masters) {
      const r = await runMaster(m, input);
      const post = postCheck(typeof r.output === "string" ? r.output : "", {
        groundedFacts: r.grounded
      });
      auditLog.push(audit(m, post.allowed ? "ok" : "blocked:post", now, { reasons: post.reasons }));
      results.push({ ...r, notes: [r.notes, ...post.reasons].filter(Boolean).join(" | ") });
    }

    const verdict: GuardianVerdict = { allowed: true, reasons: [] };
    return { event, routed: masters, results, verdict, audit: auditLog, trace: observer.trace() };
  });
}

export type { BrainEvent, BrainResult } from "./types";
