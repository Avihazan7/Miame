// brain/evals.ts — the eval suite skeleton (ULEASE_SPEC §7.2).
//
// Three pillars: golden-set (expected behaviour), grounding (every fact traces to a
// source), red-team (adversarial probes). Run as a release gate for Guardian + core
// agents; nurture/marketing copy can be a KPI dashboard rather than a hard gate.
import { postCheck } from "./guardian";

export interface EvalCase {
  name: string;
  input: string;
  expectGrounded: boolean;
}

export const GOLDEN: EvalCase[] = [
  { name: "range-question", input: "מה הטווח של מיה פור?", expectGrounded: true },
  { name: "price-4x2", input: "כמה עולה 4×2?", expectGrounded: true },
  { name: "partner-terms", input: "מה התנאים לשותף Hub?", expectGrounded: true }
];

/** Grounding gate: a numeric claim is allowed only when it is grounded in a source. */
export function gradeGrounding(output: string, grounded: boolean): boolean {
  return postCheck(output, { groundedFacts: grounded }).allowed;
}
