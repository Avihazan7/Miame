// Business/partner VAT-as-down-payment vectors are contractual (M21-A7) — locked
// here so the pricing rule can never silently drift.
import { describe, expect, it } from "vitest";
import { vatDownPayment, businessQuote } from "@/lib/simulator/pricing";

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
