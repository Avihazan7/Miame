// src/constitution.ts
// ULease OS U.M.M kernel · The Constitution — the single source of truth for every
// weight, blend and threshold the decision algorithm uses.
//
// This is the canonical home of the numbers that DEFINE the algorithm's behaviour.
// Both leasing-api and Miame consume the SAME constants from here, so the algorithm,
// its spec, and every downstream surface can never drift apart again. Tune a weight
// once, and the whole brain moves together.
//
// Pure data, deterministic, no I/O. Every convex blend sums to exactly 1 — asserted
// by test/constitution.test.ts via CONVEX_BLENDS, so a careless edit fails loudly.
/** Deal Score engine — financial quality of an offer. */
export const DEAL_SCORE = {
    // Convex blend over the four financial factors. Σ = 1.
    weights: { discount: 0.3, cost: 0.3, residual: 0.2, mileage: 0.2 },
    // Linear normalisation ranges [lo, hi] → 0..100 (cost is inverted: lower is better).
    ranges: {
        discount: { lo: 0, hi: 0.2 },
        cost: { lo: 0.9, hi: 0.4 },
        residual: { lo: 0.3, hi: 0.65 },
        mileage: { lo: 0, hi: 20000 },
    },
    // Letter-grade cut-offs on the 0..100 score.
    grades: { A: 85, B: 70, C: 55 },
};
/** Deal IQ — how good the deal is objectively. Σ = 1. */
export const DEAL_IQ = { economic: 0.4, trust: 0.45, riskComplement: 0.15 };
/** Close probability — likelihood the deal closes. Σ = 1. */
export const CLOSE_PROBABILITY = { dealIQ: 0.6, urgency: 0.4 };
/** Customer Lifetime-Value proxy from the profile. Caps + Σ = 1 of weights. */
export const LTV = {
    budget: { weight: 0.6, cap: 3000 },
    mileage: { weight: 0.4, cap: 30000 },
};
/** Autonomous Decision Score — should we act now? Σ = 1. */
export const ADS = {
    dealIQ: 0.25,
    trust: 0.2,
    marketTemperature: 0.15,
    closeProbability: 0.2,
    supplierPressure: 0.1,
    ltvScore: 0.1,
};
/** Decision protocol — ADS / masterScore band → action. */
export const DECISION_THRESHOLDS = {
    executeNow: 90, // > → EXECUTE_NOW
    sendOffer: 75, //  > → SEND_OFFER
    negotiate: 60, //  > → NEGOTIATE
    wait: 40, //       > → WAIT, else REJECT
};
/** OS U.M.M personality-fit shaping. */
export const UMM_FIT = {
    // Profile WITH strong wants: base + coverage·span  →  base..(base+span).
    base: 45,
    coverageSpan: 55,
    // Profile WITHOUT strong wants: lean on deal quality around a neutral midpoint.
    neutral: 50,
    dealScoreLean: 0.5,
};
/** /brain/match re-rank blend when a Big Five profile is supplied. Σ = 1. */
export const UMM_RERANK = { ads: 0.7, personalityFit: 0.3 };
/**
 * supplierTrust — a manipulation-resistant trust score from customer ratings.
 * A naive average lets one 5★ review outrank a 200-review 4.6★ supplier; instead
 * we shrink toward a cautious prior (Bayesian smoothing) until enough real reviews
 * accumulate. `confMedium`/`confHigh` set the review counts at which confidence rises.
 */
export const SUPPLIER_TRUST = { priorMean: 3.5, priorWeight: 5, confMedium: 5, confHigh: 20 };
/**
 * structureDeal — fitting the OPTIMAL lease STRUCTURE (not vehicle) to a customer.
 * Each criterion shifts the fit off a neutral base; explicit intent dominates, the
 * personality lean (from cognitiveProfile) is a softer tie-breaker. All deltas are
 * added then clamped to 0..100.
 */
export const STRUCTURE_FIT = {
    base: 50,
    ownership: 22,
    allInclusive: 20,
    zeroKm: 25,
    lowMonthly: 16,
    mileage: 18,
    endFlexibility: 14,
    business: 12,
    personalityLean: 8,
};
/**
 * Master Brain blend — the single coherent score that unifies the three layers:
 *   • autonomous  — the engines' ADS ("should we act now?")
 *   • financial   — the Deal Score ("is the deal objectively good?")
 *   • personality — the U.M.M fit ("does it suit THIS customer?")
 * Σ = 1. When a layer is absent the present layers are renormalised, so the master
 * score always stays on a 0..100 scale.
 */
export const MASTER = { autonomous: 0.5, financial: 0.3, personality: 0.2 };
/**
 * Learned Re-rank — the ONLY learned layer, and it sits strictly ABOVE the
 * deterministic Master Score as an additional signal, never in its place.
 * The lift is confidence-shrunk and hard-capped so the foundation always dominates.
 */
export const LEARNED_RERANK = { maxLift: 8, priorStrength: 30, trustThreshold: 0.6 };
/**
 * A/B weight calibration — the promotion gate for changing any Constitution weight.
 * OFFLINE, deterministic and HUMAN-GATED: it recommends, it never mutates the
 * Constitution (High-Confidence Policy Improvement; Thomas et al., ICML 2015).
 */
export const AB_CALIBRATION = { z: 1.96, minImpressions: 100 };
/**
 * Off-Policy Evaluation (OPE) — estimate how a CANDIDATE ranking policy WOULD have
 * performed from data logged under the CURRENT policy, with no live A/B. OFFLINE,
 * deterministic and HUMAN-GATED. Estimators: IPS, SNIPS, Doubly-Robust.
 */
export const OPE = { weightClip: 10, minSamples: 100, essMediumFrac: 0.1, essHighFrac: 0.3 };
/**
 * Registry of every convex blend that MUST sum to 1. test/constitution.test.ts walks
 * this list and fails loudly on any drift — the deterministic guard on the SST itself.
 */
export const CONVEX_BLENDS = {
    'DEAL_SCORE.weights': Object.values(DEAL_SCORE.weights),
    DEAL_IQ: Object.values(DEAL_IQ),
    CLOSE_PROBABILITY: Object.values(CLOSE_PROBABILITY),
    ADS: Object.values(ADS),
    UMM_RERANK: Object.values(UMM_RERANK),
    MASTER: Object.values(MASTER),
};
//# sourceMappingURL=constitution.js.map