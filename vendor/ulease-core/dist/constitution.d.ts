/** Deal Score engine — financial quality of an offer. */
export declare const DEAL_SCORE: {
    readonly weights: {
        readonly discount: 0.3;
        readonly cost: 0.3;
        readonly residual: 0.2;
        readonly mileage: 0.2;
    };
    readonly ranges: {
        readonly discount: {
            readonly lo: 0;
            readonly hi: 0.2;
        };
        readonly cost: {
            readonly lo: 0.9;
            readonly hi: 0.4;
        };
        readonly residual: {
            readonly lo: 0.3;
            readonly hi: 0.65;
        };
        readonly mileage: {
            readonly lo: 0;
            readonly hi: 20000;
        };
    };
    readonly grades: {
        readonly A: 85;
        readonly B: 70;
        readonly C: 55;
    };
};
/** Deal IQ — how good the deal is objectively. Σ = 1. */
export declare const DEAL_IQ: {
    readonly economic: 0.4;
    readonly trust: 0.45;
    readonly riskComplement: 0.15;
};
/** Close probability — likelihood the deal closes. Σ = 1. */
export declare const CLOSE_PROBABILITY: {
    readonly dealIQ: 0.6;
    readonly urgency: 0.4;
};
/** Customer Lifetime-Value proxy from the profile. Caps + Σ = 1 of weights. */
export declare const LTV: {
    readonly budget: {
        readonly weight: 0.6;
        readonly cap: 3000;
    };
    readonly mileage: {
        readonly weight: 0.4;
        readonly cap: 30000;
    };
};
/** Autonomous Decision Score — should we act now? Σ = 1. */
export declare const ADS: {
    readonly dealIQ: 0.25;
    readonly trust: 0.2;
    readonly marketTemperature: 0.15;
    readonly closeProbability: 0.2;
    readonly supplierPressure: 0.1;
    readonly ltvScore: 0.1;
};
/** Decision protocol — ADS / masterScore band → action. */
export declare const DECISION_THRESHOLDS: {
    readonly executeNow: 90;
    readonly sendOffer: 75;
    readonly negotiate: 60;
    readonly wait: 40;
};
/** OS U.M.M personality-fit shaping. */
export declare const UMM_FIT: {
    readonly base: 45;
    readonly coverageSpan: 55;
    readonly neutral: 50;
    readonly dealScoreLean: 0.5;
};
/** /brain/match re-rank blend when a Big Five profile is supplied. Σ = 1. */
export declare const UMM_RERANK: {
    readonly ads: 0.7;
    readonly personalityFit: 0.3;
};
/**
 * supplierTrust — a manipulation-resistant trust score from customer ratings.
 * A naive average lets one 5★ review outrank a 200-review 4.6★ supplier; instead
 * we shrink toward a cautious prior (Bayesian smoothing) until enough real reviews
 * accumulate. `confMedium`/`confHigh` set the review counts at which confidence rises.
 */
export declare const SUPPLIER_TRUST: {
    readonly priorMean: 3.5;
    readonly priorWeight: 5;
    readonly confMedium: 5;
    readonly confHigh: 20;
};
/**
 * structureDeal — fitting the OPTIMAL lease STRUCTURE (not vehicle) to a customer.
 * Each criterion shifts the fit off a neutral base; explicit intent dominates, the
 * personality lean (from cognitiveProfile) is a softer tie-breaker. All deltas are
 * added then clamped to 0..100.
 */
export declare const STRUCTURE_FIT: {
    readonly base: 50;
    readonly ownership: 22;
    readonly allInclusive: 20;
    readonly zeroKm: 25;
    readonly lowMonthly: 16;
    readonly mileage: 18;
    readonly endFlexibility: 14;
    readonly business: 12;
    readonly personalityLean: 8;
};
/**
 * Master Brain blend — the single coherent score that unifies the three layers:
 *   • autonomous  — the engines' ADS ("should we act now?")
 *   • financial   — the Deal Score ("is the deal objectively good?")
 *   • personality — the U.M.M fit ("does it suit THIS customer?")
 * Σ = 1. When a layer is absent the present layers are renormalised, so the master
 * score always stays on a 0..100 scale.
 */
export declare const MASTER: {
    readonly autonomous: 0.5;
    readonly financial: 0.3;
    readonly personality: 0.2;
};
/**
 * Learned Re-rank — the ONLY learned layer, and it sits strictly ABOVE the
 * deterministic Master Score as an additional signal, never in its place.
 * The lift is confidence-shrunk and hard-capped so the foundation always dominates.
 */
export declare const LEARNED_RERANK: {
    readonly maxLift: 8;
    readonly priorStrength: 30;
    readonly trustThreshold: 0.6;
};
/**
 * A/B weight calibration — the promotion gate for changing any Constitution weight.
 * OFFLINE, deterministic and HUMAN-GATED: it recommends, it never mutates the
 * Constitution (High-Confidence Policy Improvement; Thomas et al., ICML 2015).
 */
export declare const AB_CALIBRATION: {
    readonly z: 1.96;
    readonly minImpressions: 100;
};
/**
 * Off-Policy Evaluation (OPE) — estimate how a CANDIDATE ranking policy WOULD have
 * performed from data logged under the CURRENT policy, with no live A/B. OFFLINE,
 * deterministic and HUMAN-GATED. Estimators: IPS, SNIPS, Doubly-Robust.
 */
export declare const OPE: {
    readonly weightClip: 10;
    readonly minSamples: 100;
    readonly essMediumFrac: 0.1;
    readonly essHighFrac: 0.3;
};
/**
 * Registry of every convex blend that MUST sum to 1. test/constitution.test.ts walks
 * this list and fails loudly on any drift — the deterministic guard on the SST itself.
 */
export declare const CONVEX_BLENDS: Record<string, number[]>;
//# sourceMappingURL=constitution.d.ts.map