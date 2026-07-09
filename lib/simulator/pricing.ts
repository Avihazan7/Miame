// lib/simulator/pricing.ts — the business/partner simulator pricing rule (M21-A7).
//
// On the business & partner tracks the down-payment IS the VAT component of the
// price (a fixed amount, no slider): the buyer settles the VAT up-front and spreads
// the ex-VAT remainder over 3–18 months at 0% interest / 0% indexation.
//
//   net = total / 1.18                (ex-VAT base)
//   vat = floor(net * 0.18)           (fixed down-payment)
//   remainder = total - vat           (financed, spread over the months)
//
// Pure and deterministic — the private track is unaffected (full sliders).

const VAT_RATE = 0.18;
const VAT_MULT = 1 + VAT_RATE; // 1.18

/** The fixed VAT-as-down-payment for a VAT-inclusive total (floored, per the spec). */
export function vatDownPayment(totalInclVat: number): number {
  const net = totalInclVat / VAT_MULT;
  return Math.floor(net * VAT_RATE);
}

export interface BusinessQuote {
  total: number;
  down: number; // = VAT
  remainder: number; // financed
  months: number;
  monthly: number; // display rounding
}

/** Full business/partner quote: fixed VAT down-payment + ex-VAT remainder / months. */
export function businessQuote(totalInclVat: number, months: number): BusinessQuote {
  const down = vatDownPayment(totalInclVat);
  const remainder = Math.max(totalInclVat - down, 0);
  const monthly = months > 0 ? Math.round(remainder / months) : 0;
  return { total: totalInclVat, down, remainder, months, monthly };
}
