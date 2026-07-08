// Price Zone layer — a *pricing context* over the product catalogue, never a new
// model. MODELS.price stays the nationwide (VAT-inclusive) price; the Eilat zone
// derives an ex-VAT price for the Eilat / Green Extreme branch context.
//
// Framing matters legally: this is "מחיר אילת ללא מע״מ" (an ex-VAT price at the
// point of sale), NOT a "18% discount". Eligibility is subject to law, place of
// sale, company terms and a lawful invoice — surfaced via `legalNote`.
//
// Pure and deterministic: no I/O, no clock, no randomness. Safe to test in CI.

export type PricingZone = "nationwide" | "eilat";

/** Israeli VAT rate used to strip VAT for the Eilat ex-VAT price. */
export const VAT_RATE = 0.18;

export interface ZonePrice {
  zone: PricingZone;
  /** Human label for the price context (e.g. "מחיר אילת"). */
  label: string;
  /** Short chip shown next to the price (e.g. "ללא מע״מ"). */
  badge: string;
  /** The price to display/quote for this zone, in ILS. */
  price: number;
  /** Mandatory legal disclosure for this zone. */
  legalNote: string;
}

/**
 * Resolve the price + framing for a zone.
 *
 *   nationwide → the base price as-is (VAT included).
 *   eilat      → ex-VAT price = Math.ceil(basePrice / (1 + VAT_RATE)).
 *
 * Rounding is Math.ceil (round the ex-VAT price UP) so that ex-VAT × (1+VAT)
 * never dips below the nationwide price — a conservative, defensible display.
 *   19,900 → 16,865 · 21,900 → 18,560 · 27,900 → 23,645
 */
export function getZonePrice(basePrice: number, zone: PricingZone): ZonePrice {
  if (zone === "eilat") {
    return {
      zone,
      label: "מחיר אילת",
      badge: "ללא מע״מ",
      price: Math.ceil(basePrice / (1 + VAT_RATE)),
      legalNote:
        "מחיר אילת ללא מע״מ בכפוף לדין, מקום העסקה, תנאי החברה והפקת חשבונית כדין.",
    };
  }

  return {
    zone,
    label: "מחיר ארצי",
    badge: "כולל מע״מ",
    price: basePrice,
    legalNote: "מחיר ארצי כולל מע״מ, בכפוף לתנאי החברה והיבואן.",
  };
}
