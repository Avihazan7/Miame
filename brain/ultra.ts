// brain/ultra.ts — the Ultra orchestrator (ULEASE_SPEC §7).
//
// Ultra owns event→routing and state. Routing is DETERMINISTIC (a lookup table) so
// the system is predictable, testable and auditable; the LLM judgement lives one
// layer down, in the Masters. This is the heart of the "unique methodology": a
// thin, rule-based conductor over expensive specialists.
import type { BrainEventType } from "./types";

export type MasterName = "match" | "deal" | "content" | "support" | "concierge";

const ROUTES: Record<BrainEventType, MasterName[]> = {
  question: ["concierge"],
  lead_inbound: ["match", "deal"],
  simulator_quote: ["deal"],
  partner_inquiry: ["match", "deal"],
  deal_closed: ["content"],
  support_ticket: ["support"]
};

export function route(type: BrainEventType): MasterName[] {
  return ROUTES[type] ?? [];
}
