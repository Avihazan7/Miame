// Business/partner VAT-as-down-payment vectors are contractual (M21-A7) — locked
// here so the pricing rule can never silently drift.
import { describe, expect, it } from "vitest";
import { vatDownPayment, businessQuote } from "@/lib/simulator/pricing";
import { computeQuote } from "@/lib/finance";
import { MODELS } from "@/lib/models";

describe("vatDownPayment (business/partner)", () => {
  const VECTORS: [number, number, number][] = [
    // total, vat/down, remainder
    [19900, 3035, 16865],
    [21900, 3340, 18560],
    [27900, 4255, 23645],
  ];

  for (const [total, down, remainder] of VECTORS) {
    it(`${total} → ${down} / ${remainder}`, () => {
      expect(vatDownPayment(total)).toBe(down);
      expect(total - vatDownPayment(total)).toBe(remainder);
    });
  }

  it("spreads the remainder over the months (display rounding)", () => {
    const q = businessQuote(19900, 18);
    expect(q.down).toBe(3035);
    expect(q.remainder).toBe(16865);
    expect(q.monthly).toBe(Math.round(16865 / 18));
  });

  it("never goes negative or divides by zero", () => {
    expect(businessQuote(0, 0)).toMatchObject({ down: 0, remainder: 0, monthly: 0 });
  });
});

describe("the payment schedule adds up — every configuration a buyer can reach", () => {
  // FOUND BY ENUMERATION, NOT BY READING (2026-09-10). The instalment was
  // `Math.round(financedAmount / months)` and nothing carried the remainder, so the
  // schedule did not reconcile with the balance shown four rows above it. Across the
  // ENTIRE reachable private-track space — 3 prices × 51 down-payment steps (0–50%) ×
  // 16 terms (3–18) = 2,448 configurations:
  //
  //     exact  (months × monthly === financed) :   531  (21.7%)
  //     OVER   (the buyer pays MORE)           : 1,068  (43.6%)
  //     under                                  :   849  (34.7%)
  //     worst OVER: 19,900 ₪ · 1% down · 18 months → financed 19,701, monthly 1,095,
  //                 18 × 1,095 = 19,710 — nine shekels under a badge saying "0% ריבית".
  //
  // The panel renders "יתרה למימון" and "× N תשלומים" in the same visible block, so a
  // buyer who multiplies is doing the obvious thing. "משוער" disclosed the gap; it did
  // not make the arithmetic true.
  //
  // This is enumerated rather than sampled ON PURPOSE. A handful of spot cases is what
  // let a 43.6% defect live: the default configuration (19,900 · 25% · 18) is one of
  // the ones that lands UNDER, so any test built from the number on screen would have
  // agreed with the bug.
  const PRICES = MODELS.map((m) => m.price);

  it("reconciles exactly in all 2,448 reachable configurations", () => {
    let checked = 0;
    const broken: string[] = [];
    for (const basePrice of PRICES) {
      for (let downPct = 0; downPct <= 50; downPct++) {
        for (let months = 3; months <= 18; months++) {
          const q = computeQuote({ basePrice, type: "private", downPct, balloonPct: 0, months });
          checked++;
          if (q.monthlyPayment * (q.months - 1) + q.finalPayment !== q.financedAmount) {
            broken.push(`${basePrice}/${downPct}%/${months}m`);
          }
        }
      }
    }
    expect(checked).toBe(2_448);
    expect(broken.slice(0, 10), `${broken.length} schedules do not sum to the balance`).toEqual([]);
  });

  it("no regular instalment ever exceeds the buyer's fair share", () => {
    // The direction matters, not just the identity. Flooring guarantees the recurring
    // payment is never above `financed / months`; the remainder rides on the last one.
    const over: string[] = [];
    for (const basePrice of PRICES) {
      for (let downPct = 0; downPct <= 50; downPct++) {
        for (let months = 3; months <= 18; months++) {
          const q = computeQuote({ basePrice, type: "private", downPct, balloonPct: 0, months });
          if (q.monthlyPayment * q.months > q.financedAmount) over.push(`${basePrice}/${downPct}%/${months}m`);
        }
      }
    }
    expect(over.slice(0, 10), `${over.length} configurations overcharge the regular instalment`).toEqual([]);
  });

  it("the final instalment stays within one term of the regular one", () => {
    // A remainder is bounded by `months - 1` shekels. If this ever grows, the schedule
    // has stopped being N equal payments plus a rounding tail and become something the
    // copy no longer describes.
    let worst = 0;
    for (const basePrice of PRICES) {
      for (let downPct = 0; downPct <= 50; downPct++) {
        for (let months = 3; months <= 18; months++) {
          const q = computeQuote({ basePrice, type: "private", downPct, balloonPct: 0, months });
          worst = Math.max(worst, q.finalPayment - q.monthlyPayment);
          expect(q.finalPayment - q.monthlyPayment).toBeLessThan(q.months);
          expect(q.finalPayment).toBeGreaterThanOrEqual(q.monthlyPayment);
        }
      }
    }
    expect(worst).toBe(17);
  });
});
