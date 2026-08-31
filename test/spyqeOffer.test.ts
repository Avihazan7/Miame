/**
 * The SPYQE pre-order, made mechanical.
 *
 * Three things must not drift: the arithmetic, the honesty about the missing
 * specification, and the phrasing of a real 248-unit allocation as something
 * other than a fake stock counter.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  SPYQE,
  SPYQE_TOTAL,
  SPYQE_SAVING,
  SPYQE_SPEC,
  SPYQE_PRODUCT_PROPERTIES,
  spyqeProductJsonLd,
} from "@/lib/spyqe";
import { PRODUCT_PROPERTIES } from "@/lib/seo/product-jsonld";
import { HOME_FAQ } from "@/lib/home-faq";
import { MIA_FOUR_DELIVERY_DAYS } from "@/lib/content";
import { WA_CTA } from "@/lib/wa-cta";
import { FORBIDDEN_BUZZ_PATTERNS } from "@/lib/deal-buzz";

const section = readFileSync("components/Spyqe.tsx", "utf8");
const truth = readFileSync("lib/spyqe.ts", "utf8");

/**
 * Strip comments before scanning for hard-coded values. A doc comment that
 * EXPLAINS the derivation ("10,782 — derived, never typed") is the opposite of
 * the defect the rule targets; without this the rule would punish the very
 * comment that documents it.
 */
/**
 * Collapse whitespace before matching prose. JSX wraps copy across lines, so a
 * sentence that renders as one string does not exist as one in the source —
 * asserting on the raw file makes a passing test depend on where Prettier broke
 * the line.
 */
const text = (src: string) => src.replace(/\s+/g, " ");

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

describe("SPYQE publishes only the Israeli figures", () => {
  // The manufacturer's table prints "25 km/h | 15 mph | 45 km/h". The two higher
  // figures are foreign listings — the source itself notes US units are capped at
  // 16 mph. Israel is a קלנועית market and its ceiling is 25, which is the number
  // the manufacturer's own Key Features and stat band print. Publishing 45 on a
  // page that sells on קלנועית status advertises a vehicle outside the category.
  it("never carries the foreign top-speed figures", () => {
    for (const src of [code(section), code(truth)]) {
      expect(src, "45 km/h is not the Israeli figure").not.toMatch(/\b45\s*(km\/h|קמ)/);
      expect(src, "mph has no place on an Israeli storefront").not.toMatch(/\bmph\b/);
    }
  });

  it("publishes 25 km/h and names the standard the manufacturer certifies", () => {
    const speed = SPYQE_SPEC.find((r) => r.label.includes("מהירות"));
    expect(speed?.value).toContain("25");
    expect(speed?.note, "the Israeli ceiling is why 25 is the published number")
      .toContain("קלנועית");
    expect(SPYQE_SPEC.some((r) => r.value.includes("EN17128"))).toBe(true);
  });

  it("keeps every qualifier the manufacturer printed", () => {
    // A range figure stripped of "may vary" is a promise the maker did not make.
    const range = SPYQE_SPEC.find((r) => r.label.includes("טווח"));
    expect(range?.value).toContain("עד");
    expect(range?.note).toBeTruthy();
  });

  it("shows the spec's provenance on the page, not only in a comment", () => {
    expect(section).toContain("SPYQE_SPEC_SOURCE");
    expect(truth).toContain("docs/evidence/spyqe-2026-08-31");
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

  it("still says out loud which figures are missing", () => {
    // The captured table stops before these. Silence would read as an oversight;
    // naming them is what keeps the published rows credible.
    expect(text(section)).toContain("משקל");
    expect(text(section)).toContain("עומס מרבי");
    expect(text(section)).toContain("יפורסם כשיאומת");
  });

  it("carries no row for a figure the source never printed", () => {
    const labels = SPYQE_SPEC.map((r) => r.label).join(" ");
    for (const absent of ["משקל", "עומס", "טעינה", "מתח", "הספק"]) {
      expect(labels, `SPYQE_SPEC has a "${absent}" row but the capture has no such value`)
        .not.toContain(absent);
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
    expect(text(section)).toContain("הנרשמים הראשונים");
    for (const banned of ["נשארו", "נותרו", "מובטח", "בלבד במלאי"]) {
      expect(copy).not.toContain(banned);
    }
  });

  it("frames delivery as an estimate and keeps the approval caveat", () => {
    expect(text(section)).toContain("אספקה משוערת עד");
    expect(text(section)).toContain("כפופים לעדכון ולאישור החברה/היבואן");
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

describe("SPYQE reaches search and answer engines without leaking MIA FOUR", () => {
  const ld = spyqeProductJsonLd("https://www.miame.co.il");
  const llms = readFileSync("public/llms.txt", "utf8");

  it("never reuses the shared product properties", () => {
    // PRODUCT_PROPERTIES opens with "מנוע — עד 1,800W לפי דגם", a MIA FOUR
    // rating. Reusing it would put a MIA FOUR motor on SPYQE in the one layer
    // no human reviewer reads.
    const shared = PRODUCT_PROPERTIES.map((p) => p.value);
    const mine = SPYQE_PRODUCT_PROPERTIES.map((p) => p.value);
    for (const v of shared) expect(mine).not.toContain(v);
    expect(JSON.stringify(ld)).not.toContain("1,800W");
  });

  it("declares a pre-order at the price a buyer can actually pay", () => {
    expect(ld.offers.availability).toBe("https://schema.org/PreOrder");
    expect(ld.offers.price).toBe(SPYQE_TOTAL);
    expect(ld.offers.priceSpecification.price).toBe(SPYQE.listPrice);
  });

  it("claims no rating and no review, because none exist", () => {
    const j = JSON.stringify(ld);
    expect(j).not.toContain("aggregateRating");
    expect(j).not.toContain("\"review\"");
  });

  it("tells answer engines which SPYQE figures do not exist", () => {
    expect(llms).toContain("SPYQE");
    expect(llms, "an answer engine must be told not to borrow MIA FOUR's numbers")
      .toContain("אין להעביר נתון מאחד לשני");
    expect(llms).not.toMatch(/\bmph\b/);
    expect(llms).not.toMatch(/45\s*קמ/);
  });
});

describe("one delivery story across every surface", () => {
  // Three surfaces used to answer this differently: the strip said one thing,
  // llms.txt said "מיידית", and the FAQ said "מיידית" too. A buyer, a crawler
  // and the assistant must not get three answers to the same question.
  const llms = readFileSync("public/llms.txt", "utf8");
  const faq = HOME_FAQ.find((f) => f.q.includes("אספקה"));

  it("quotes MIA FOUR's real supply commitment everywhere", () => {
    // A boundary, not a substring: "33 ימי עסקים" CONTAINS "3 ימי עסקים", so a
    // plain toContain passes on a file that only mentions the SPYQE estimate.
    // This test found that on itself.
    const days = new RegExp(`(^|\\D)${MIA_FOUR_DELIVERY_DAYS} ימי עסקים`);
    expect(faq?.a).toMatch(days);
    expect(llms).toMatch(days);
    expect(faq?.a, "immediate delivery is no longer the claim").not.toContain("מיידית");
    expect(llms, "immediate delivery is no longer the claim").not.toContain("מיידית");
  });

  it("keeps the SPYQE estimate distinct from it", () => {
    expect(faq?.a).toContain(SPYQE.name);
    expect(llms).toContain(`${SPYQE.deliveryBusinessDays} ימי עסקים`);
  });
});
