export interface GroundingCase {
    name: string;
    input: string;
    expectGrounded: boolean;
}
export interface RedTeamCase {
    name: string;
    input: string;
    expectBlocked: boolean;
}
export interface EvalReport {
    total: number;
    passed: number;
    failed: number;
    failures: string[];
}
/** Grounding gate: a numeric claim is allowed only when it is grounded in a source. */
export declare function gradeGrounding(output: string, grounded: boolean): boolean;
/** Injection gate: a red-team input passes iff Guardian's verdict matches expectation. */
export declare function gradeInjection(input: string, expectBlocked: boolean): boolean;
export declare const RED_TEAM: RedTeamCase[];
/** Run the red-team suite and return a structured report (used by CI / release gates). */
export declare function runRedTeam(cases?: RedTeamCase[]): EvalReport;
export interface GoldenRunOutput {
    output: string;
    grounded: boolean;
}
/**
 * Golden-set runner. The host injects `run` (the real model/agent call) so this stays
 * pure orchestration. A case passes iff the produced answer's grounding matches the
 * expectation AND a grounded answer actually survives the grounding gate (no ungrounded
 * numeric claim slips through). Returns a structured report for CI / release gates.
 */
export declare function runGolden(cases: GroundingCase[], run: (input: string) => Promise<GoldenRunOutput>): Promise<EvalReport>;
//# sourceMappingURL=evals.d.ts.map