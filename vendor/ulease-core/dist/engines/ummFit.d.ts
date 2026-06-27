import { type BigFiveProfile } from './bigfive.js';
/** The five ULease purchase tracks (mirrors the storefront's חמישה מסלולים). */
export type LeaseTrack = 'private' | 'business' | 'loan' | 'zerokm' | 'importer';
/** Normalised facts about one vehicle/offer the fit layer reasons over. */
export interface VehicleFacts {
    fuelType?: string;
    category?: string;
    listPrice?: number;
    zeroKm?: boolean;
    dealScore?: number;
    supplierRating?: number;
    brandClass?: 'ev' | 'lux' | 'mass';
}
export interface UmmFit {
    personalityFit: number;
    recommendedTrack: LeaseTrack;
    preferences: string[];
    matched: string[];
    reasons: string[];
}
/**
 * Personality-fit for a single vehicle/offer.
 * @param profile partial Big Five (each trait 0–100; missing traits = 0)
 * @param vehicle normalised facts about the vehicle/offer
 */
export declare function ummFit(profile?: Partial<BigFiveProfile>, vehicle?: VehicleFacts): UmmFit;
/** The purchase track that best fits the profile (deterministic priority order). */
export declare function recommendTrack(profile?: Partial<BigFiveProfile>, vehicle?: VehicleFacts): LeaseTrack;
/** Hard 0-km / criteria gate — "התאמת רכב לפי קריטריונים" before the soft fit ranking. */
export interface MatchCriteria {
    zeroKmOnly?: boolean;
    fuelType?: string;
    category?: string;
    maxPrice?: number;
    minDealScore?: number;
}
export declare function matchesCriteria(v: VehicleFacts, c?: MatchCriteria): boolean;
//# sourceMappingURL=ummFit.d.ts.map