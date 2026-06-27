// brain/types.ts — U.M.M core types.
//
// Methodology source: leasing-api-co-il `CASES/ULEASE_SPEC.md` §7 (Ultra·Master·Max)
// and `CASES/ULEASE_METHODOLOGY.md` (Big Five / OCEAN matching). Self-contained:
// this folder shares NO types with the MiaMe site (app/, components/, lib/).

export type ModelTier = "ultra" | "master" | "max";

export type BrainEventType =
  | "lead_inbound" // new lead from web form / WhatsApp
  | "simulator_quote" // a deal was configured in the simulator
  | "partner_inquiry" // MiaMe Hub (fleet) partner interest
  | "deal_closed" // sale or rental closed
  | "support_ticket" // service / maintenance request
  | "question"; // general Q&A about MIA FOUR (the website chat)

export interface BrainEvent {
  type: BrainEventType;
  payload: Record<string, unknown>;
  source?: string;
  createdAt?: string;
}

/** Big Five (OCEAN) — the unique matching methodology (ULEASE_METHODOLOGY). 0..1 each. */
export interface BigFive {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export type Segment = "commuter" | "fleet" | "partner" | "unknown";

export interface CustomerProfile {
  fullName?: string;
  phone?: string;
  segment?: Segment;
  bigFive?: Partial<BigFive>;
}

export interface AgentResult {
  agent: string;
  tier: ModelTier;
  output: unknown;
  grounded: boolean; // were numeric/spec claims grounded in a retrieved source?
  notes?: string;
}

// GuardianVerdict + AuditEntry are owned by the shared kernel (@ulease/core); re-exported
// here so existing `./types` import paths keep working with a single source of truth.
export type { GuardianVerdict, AuditEntry } from "@ulease/core";
import type { GuardianVerdict, AuditEntry } from "@ulease/core";

export interface BrainResult {
  event: BrainEvent;
  routed: string[]; // master names invoked
  results: AgentResult[];
  verdict: GuardianVerdict;
  audit: AuditEntry[];
}
