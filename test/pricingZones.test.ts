// Price Zone contract — the Eilat ex-VAT price is a *displayed customer price*,
// so its rounding is locked here. If a future edit changes the formula or a
// model price, this test fails the build before a wrong number reaches a lead.

import { describe, expect, it } from "vitest";
import { getZonePrice, VAT_RATE } from "@/lib/pricing-zones";

// The three catalogue prices (nationwide, VAT-incl.) and their Eilat ex-VAT
// values under Math.ceil(price / 1.18).
const CASES = [
  { base: 19900, eilat: 16865 }, // 4×2
  { base: 21900, eilat: 18560 }, // 2×4 Long Range  (ceil(18559.32) = 18560)
  { base: 27900, eilat: 23645 }, // 4×4
];

describe("pricing-zones · Eilat ex-VAT", () => {
  it("VAT_RATE is the Israeli 18%", () => {
    expect(VAT_RATE).toBe(0.18);
  });

  it("Eilat price = Math.ceil(base / 1.18) for every model", () => {
    for (const c of CASES) {
      expect(getZonePrice(c.base, "eilat").price).toBe(c.eilat);
    }
  });

  it("nationwide keeps the base price (VAT included)", () => {
    for (const c of CASES) {
      expect(getZonePrice(c.base, "nationwide").price).toBe(c.base);
    }
  });

  it("ex-VAT × (1 + VAT) never dips below the nationwide price", () => {
    for (const c of CASES) {
      const exVat = getZonePrice(c.base, "eilat").price;
      expect(exVat * (1 + VAT_RATE)).toBeGreaterThanOrEqual(c.base);
    }
  });

  it("carries the correct labels, badges and legal notes", () => {
    const eilat = getZonePrice(19900, "eilat");
    expect(eilat.zone).toBe("eilat");
    expect(eilat.label).toBe("מחיר אילת");
    expect(eilat.badge).toBe("ללא מע״מ");
    expect(eilat.legalNote).toContain("בכפוף לדין");

    const nation = getZonePrice(19900, "nationwide");
    expect(nation.zone).toBe("nationwide");
    expect(nation.label).toBe("מחיר ארצי");
    expect(nation.badge).toBe("כולל מע״מ");
  });
});
