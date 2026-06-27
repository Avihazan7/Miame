// src/engines/ummFit.ts
// ULease OS U.M.M kernel · Personality-Fit layer (Ultra Master Matrix).
//
// Turns a customer's Big Five profile into (a) a personality-fit score for a specific
// vehicle/offer and (b) the financing/lease track that best suits that profile, with a
// transparent Hebrew explanation of *why*. Deterministic and pure (no I/O): identical
// inputs always yield the identical fit.
//
// It reuses the Big Five → preferences map from `bigfive.ts` as the single source of
// truth, so the behaviour layer and the matching layer can never drift apart.
import { cognitiveProfile } from './bigfive.js';
import { UMM_FIT } from '../constitution.js';
const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));
const num = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const isEV = (f) => f === 'חשמלי' || f === 'היברידי' || f === 'פלאג-אין';
const RULES = [
    { pref: 'EV', ok: (v) => isEV(v.fuelType) || v.brandClass === 'ev', why: 'הנעה חשמלית/היברידית — תואם פתיחות לטכנולוגיה' },
    { pref: 'innovativeModels', ok: (v) => isEV(v.fuelType) || v.brandClass === 'ev', why: 'דגם חדשני' },
    { pref: 'subscriptions', ok: (v) => !!v.zeroKm, why: 'מתאים למודל מנוי/ליסינג מתחדש' },
    { pref: 'premiumCars', ok: (v) => v.category === 'יוקרה' || v.brandClass === 'lux', why: 'רכב יוקרה — תואם העדפת סטטוס' },
    { pref: 'statusBrands', ok: (v) => v.category === 'יוקרה' || v.brandClass === 'lux', why: 'מותג בעל יוקרה ונוכחות' },
    { pref: 'warranty', ok: (v) => !!v.zeroKm, why: '0 ק״מ — אחריות יצרן מלאה' },
    { pref: 'lowRisk', ok: (v) => !!v.zeroKm && (v.supplierRating ?? 0) >= 4, why: 'רכב חדש מספק מדורג — סיכון נמוך' },
    { pref: 'highTrust', ok: (v) => (v.supplierRating ?? 0) >= 4.2, why: 'ספק בדירוג גבוה' },
    { pref: 'trust', ok: (v) => (v.supplierRating ?? 0) >= 4, why: 'ספק אמין' },
    { pref: 'stability', ok: (v) => (v.dealScore ?? 0) >= 80, why: 'עסקה יציבה (Deal Score גבוה)' },
    { pref: 'strongBrands', ok: (v) => v.brandClass === 'lux' || (v.supplierRating ?? 0) >= 4.2, why: 'מותג חזק ומבוסס' },
    { pref: 'longContracts', ok: (v) => !!v.zeroKm, why: 'מתאים לחוזה ארוך (רכב חדש)' },
    { pref: 'simplicity', ok: (v) => !!v.zeroKm, why: 'חבילת הכל-כלול (0 ק״מ)' },
    { pref: 'bundles', ok: (v) => !!v.zeroKm, why: 'חבילת ליסינג כוללת' },
    { pref: 'fastDecision', ok: (v) => (v.dealScore ?? 0) >= 85, why: 'עסקה חזקה המאפשרת החלטה מהירה' },
];
/**
 * Personality-fit for a single vehicle/offer.
 * @param profile partial Big Five (each trait 0–100; missing traits = 0)
 * @param vehicle normalised facts about the vehicle/offer
 */
export function ummFit(profile = {}, vehicle = {}) {
    // Reuse the canonical Big Five → preferences map (single source of truth).
    const { preferences } = cognitiveProfile(profile, vehicle.dealScore ?? 0);
    const matched = [];
    const reasons = [];
    for (const pref of preferences) {
        const rule = RULES.find((r) => r.pref === pref);
        if (rule && rule.ok(vehicle)) {
            matched.push(pref);
            reasons.push(rule.why);
        }
    }
    // Fit: a neutral car scores ~mid. Satisfied wants lift it toward 100; a profile with
    // no strong wants falls back to deal quality so ranking stays sensible.
    let personalityFit;
    if (preferences.length === 0) {
        personalityFit = clamp(UMM_FIT.neutral + ((vehicle.dealScore ?? UMM_FIT.neutral) - UMM_FIT.neutral) * UMM_FIT.dealScoreLean);
    }
    else {
        const coverage = matched.length / preferences.length; // 0..1
        personalityFit = clamp(UMM_FIT.base + coverage * UMM_FIT.coverageSpan); // base..(base+span)
    }
    return { personalityFit, recommendedTrack: recommendTrack(profile, vehicle), preferences, matched, reasons };
}
/** The purchase track that best fits the profile (deterministic priority order). */
export function recommendTrack(profile = {}, vehicle = {}) {
    const neuro = num(profile.neuroticism), consc = num(profile.conscientiousness), open = num(profile.openness), extra = num(profile.extraversion);
    // High anxiety or high conscientiousness → predictable, all-inclusive private lease.
    if (neuro > 70 || consc > 80)
        return 'private';
    // Openness to new tech + an EV on the table → a fresh 0-km delivery.
    if (open > 80 && (isEV(vehicle.fuelType) || vehicle.brandClass === 'ev'))
        return 'zerokm';
    // Outgoing / status-driven → a business (representation/fleet) lease.
    if (extra > 80)
        return 'business';
    return 'private';
}
export function matchesCriteria(v, c = {}) {
    if (c.zeroKmOnly && !v.zeroKm)
        return false;
    if (c.fuelType && v.fuelType !== c.fuelType)
        return false;
    if (c.category && v.category !== c.category)
        return false;
    if (c.maxPrice != null && (v.listPrice ?? Infinity) > c.maxPrice)
        return false;
    if (c.minDealScore != null && (v.dealScore ?? 0) < c.minDealScore)
        return false;
    return true;
}
//# sourceMappingURL=ummFit.js.map