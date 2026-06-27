// @ulease/core — the OS U.M.M kernel barrel.
//
// The single source of truth for the pure, deterministic decision engines, the
// rule-based Guardian, and the eval harness. Consumed by leasing-api and Miame so the
// algorithm, its safety invariants, and its evals can never drift across the portfolio.
//
// Everything exported here is pure and deterministic: no Date.now(), no Math.random(),
// no fetch(), no process.env, no I/O. Timestamps and side effects belong to the host.
export * as constitution from './constitution.js';
export * from './engines/index.js';
export * from './guardian/index.js';
export * from './evals/index.js';
export * from './observability/index.js';
export * from './router/index.js';
//# sourceMappingURL=index.js.map