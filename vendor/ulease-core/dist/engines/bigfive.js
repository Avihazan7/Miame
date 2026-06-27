// src/engines/bigfive.ts
// ULease OS U.M.M kernel · Behavior layer — the Big Five Decision Engine. Maps a
// personality profile to product preferences + a cognitive UI state (Calm-Tech).
// Deterministic and pure (no I/O). Single source of truth for what each personality
// trait values, reused by the U.M.M fit engine so behaviour and matching never drift.
const n = (v) => Math.max(0, Math.min(100, Number(v) || 0));
export function cognitiveProfile(p = {}, dealScore = 0) {
    const openness = n(p.openness), consc = n(p.conscientiousness), extra = n(p.extraversion), agree = n(p.agreeableness), neuro = n(p.neuroticism);
    // Preferences accumulate from every dominant trait (business-impact map).
    const preferences = [];
    if (neuro > 70)
        preferences.push('lowRisk', 'instantAnswers', 'warranty', 'highTrust');
    if (consc > 80)
        preferences.push('trust', 'stability', 'longContracts', 'strongBrands');
    if (extra > 80)
        preferences.push('premiumCars', 'fastDecision', 'statusBrands');
    if (openness > 80)
        preferences.push('EV', 'innovativeModels', 'subscriptions');
    if (agree > 80)
        preferences.push('simplicity', 'bundles', 'longRelationships');
    // Cognitive UI state — priority order from the OS X doctrine.
    let cognitiveState;
    let density;
    let animations;
    if (neuro > 70) {
        cognitiveState = 'calm';
        density = 'low';
        animations = false;
    }
    else if (consc > 80) {
        cognitiveState = 'analytical';
        density = 'high';
        animations = false;
    }
    else if (extra > 80) {
        cognitiveState = 'social';
        density = 'medium';
        animations = true;
    }
    else if (dealScore > 90) {
        cognitiveState = 'action';
        density = 'medium';
        animations = true;
    }
    else {
        cognitiveState = 'focus';
        density = 'medium';
        animations = false;
    }
    return { cognitiveState, density, animations, preferences: [...new Set(preferences)] };
}
//# sourceMappingURL=bigfive.js.map