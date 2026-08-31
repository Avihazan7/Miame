/**
 * The SPYQE pre-order, made mechanical.
 *
 * Three things must not drift: the arithmetic, the honesty about the missing
 * specification, and the phrasing of a real 248-unit allocation as something
 * other than a fake stock counter.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { SPYQE, SPYQE_TOTAL, SPYQE_SAVING } from "@/lib/spyqe";
import { WA_CTA } from "@/lib/wa-cta";
import { FORBIDDEN_BUZZ_PATTERNS } from "@/lib/deal-buzz";
import { MIA_FOUR_DELIVERY_DAYS } from "@/lib/content";

const section = readFileSync("components/Spyqe.tsx", "utf8");
const truth = readFileSync("lib/spyqe.ts", "utf8");

/**
 * Strip comments before scanning for hard-coded values. A doc comment that
 * EXPLAINS the derivation ("10,782 — derived, never typed") is the opposite of
 * the defect the rule targets; without this the rule would punish the very
 * comment that documents it.
 */
const code = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, " ").split("\n").map((l) => l.replace(/\/\/.*$/, "")).join("\n");

describe("SPYQE offer arithmetic", () => {
  it("derives the total from the payment and the term", () => {
    // Asserting the DERIVATION, not two constants that happen to agree today:
    // change the monthly payment and the total must follow it, not contradict it.
    expect(SPYQE_TOTAL).toBe(SPYQE.monthlyPayment * SPYQE.months);
    expect(SPYQE_SAVING).toBe(SPYQE.listPrice - SPYQE_TOTAL);
  });

  it("carries the owner's numbers", () => {
    expect(SPYQE.monthlyPayment).toBe(599);
    expect(SPYQE.months).toBe(18);
    expect(SPYQE.listPrice).toBe(11_900);
    expect(SPYQE.slots).toBe(248);
    expect(SPYQE.deliveryBusinessDays).toBe(33);
    expect(SPYQE_TOTAL).toBe(10_782);
    expect(SPYQE_SAVING).toBe(1_118);
  });

  it("never hard-codes a derived figure in the section or the message", () => {
    // A literal 10782/10,782 anywhere outside the derivation is a second source
    // of truth waiting to disagree with the first.
    // SOURCE, not output. The rendered message must SHOW 10,782 — a buyer needs
    // the number. What must not exist is a second place that TYPES it, free to
    // disagree with 599 × 18 after the next edit.
    for (const file of ["components/Spyqe.tsx", "lib/spyqe.ts", "lib/wa-cta.ts"]) {
      const src = code(readFileSync(file, "utf8"));
      expect(src, `${file} hard-codes the derived total`).not.toMatch(/10[,.]?782/);
      expect(src, `${file} hard-codes the derived saving`).not.toMatch(/1[,.]?118/);
    }
  });

  it("puts the whole offer into the WhatsApp message", () => {
    const m = WA_CTA.spyqe.message;
    for (const part of ["599", "18", "10,782", "11,900", "248"]) expect(m).toContain(part);
    expect(WA_CTA.spyqe.intent).toBe("order");
  });

  it("keeps the SPYQE term inside the site's 18-payment ceiling", () => {
    expect(SPYQE.months).toBeLessThanOrEqual(18);
  });
});

describe("SPYQE publishes no unverified specification", () => {
  // MIA FOUR's published figures. SPYQE is a different vehicle at roughly half
  // the price; any of these appearing on the SPYQE surface means someone copied
  // a number across instead of waiting for the manufacturer to confirm one.
  const MIA_FOUR_FIGURES = [
    "1,800W", "1800W", "60V", "25/35Ah", "35Ah", "6.3 ק\"ג", "21700",
    "689", "1,244", "1,190", "42 ק\"ג", "136 ק\"ג",
  ];

  it("carries none of MIA FOUR's numbers", () => {
    for (const fig of MIA_FOUR_FIGURES) {
      expect(code(section), `MIA FOUR figure "${fig}" leaked onto SPYQE`).not.toContain(fig);
      expect(code(truth), `MIA FOUR figure "${fig}" leaked into the SPYQE data`).not.toContain(fig);
    }
  });

  it("says out loud that the spec is not published yet", () => {
    // Silence would read as an oversight. Saying it is a trust signal.
    expect(section).toContain("המפרט המלא");
    expect(section).toContain("לא מפרסמים");
  });

  it("exposes no spec fields at all in the data module", () => {
    for (const key of ["motor", "battery", "range", "topSpeed", "weight", "maxLoad", "dimensions"]) {
      expect(code(truth), `lib/spyqe.ts declares "${key}" — it has no verified value to hold`)
        .not.toMatch(new RegExp(`\\b${key}\\s*:`));
    }
  });
});

describe("SPYQE scarcity is real, not manufactured", () => {
  // The 248 cap is a genuine allocation the owner stated. The no-fake-scarcity
  // contract in lib/deal-buzz.ts only covered the buzz layer; the SPYQE offer is
  // exactly the kind of copy it exists to police, so it is held to it too.
  const copy = [section, WA_CTA.spyqe.message, WA_CTA.spyqe.label].join(" ");

  it("matches none of the forbidden scarcity patterns", () => {
    for (const rx of FORBIDDEN_BUZZ_PATTERNS) {
      expect(copy, `forbidden pattern matched: ${rx}`).not.toMatch(rx);
    }
  });

  it("states the cap as a condition of entry, not as units left", () => {
    expect(section).toContain("הנרשמים הראשונים");
    for (const banned of ["נשארו", "נותרו", "מובטח", "בלבד במלאי"]) {
      expect(copy).not.toContain(banned);
    }
  });

  it("frames delivery as an estimate and keeps the approval caveat", () => {
    expect(section).toContain("אספקה משוערת עד");
    expect(section).toContain("כפופים לעדכון ולאישור החברה/היבואן");
  });
});

describe("two models, two different waits", () => {
  it("keeps MIA FOUR's in-stock promise separate from the SPYQE estimate", () => {
    // The whole commercial point: MIA FOUR ships now, SPYQE is a pre-order.
    // Collapsing the two numbers into one would mislead in both directions.
    expect(MIA_FOUR_DELIVERY_DAYS).toBe(3);
    expect(SPYQE.deliveryBusinessDays).toBe(33);
    expect(MIA_FOUR_DELIVERY_DAYS).toBeLessThan(SPYQE.deliveryBusinessDays);
  });

  it("states MIA FOUR's supply as a ceiling conditioned on stock", () => {
    const service = readFileSync("components/Service.tsx", "utf8");
    expect(service).toContain("אספקה עד ");
    expect(service).toContain("בכפוף לזמינות");
  });
});
