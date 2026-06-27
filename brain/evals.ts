// brain/evals.ts — Miame eval entrypoint.
//
// The grading logic (grounding + prompt-injection) and the shared red-team suite now
// live in the kernel @ulease/core, so the release gate is identical across the
// portfolio. This file keeps only the Miame-specific golden cases (mia four) and
// re-exports the shared graders so callers have one import.
import { gradeGrounding, gradeInjection, runRedTeam, RED_TEAM } from "@ulease/core";

export { gradeGrounding, gradeInjection, runRedTeam, RED_TEAM };

export interface EvalCase {
  name: string;
  input: string;
  expectGrounded: boolean;
}

// Miame-specific golden questions. Grounding is graded by the shared kernel.
export const GOLDEN: EvalCase[] = [
  { name: "range-question", input: "מה הטווח של מיה פור?", expectGrounded: true },
  { name: "price-4x2", input: "כמה עולה 4×2?", expectGrounded: true },
  { name: "partner-terms", input: "מה התנאים לשותף Hub?", expectGrounded: true }
];
