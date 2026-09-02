// test/entityNaming.test.ts — the site names ONE entity, consistently, in both scripts.
//
// ── THE DEFECT THIS FILE EXISTS FOR ──────────────────────────────────────────
// Measured 2026-09-01, the two machine-readable surfaces — the Product schema and
// llms.txt — both called the product "MiaMe Four". That name exists in NO source:
// the hero says MIA FOUR, the corpus says מיה פור, the manufacturer says MIA FOUR.
// It is the SITE's name (MiaMe) welded onto the PRODUCT's, sitting in exactly the
// two places a machine reads as authoritative.
//
// That is the same defect class as the catalogue's "4×2", fixed earlier the same
// day: a designation from no source. For entity resolution it is worse than a
// typo — it teaches Google and the answer engines a name that will never appear
// in a query, and it splits one entity into two weak ones.
//
// ── AND THE ABSENCES, WHICH WERE LARGER ──────────────────────────────────────
//     "מיה דיינמיקס" ... 0 occurrences in the whole served tree AND 0 of 37 corpus rows
//     "MIA FOUR" ...... 0 of 37 corpus rows
//     homepage <title> . named neither the product nor the category
//     alternateName ... carried the DOMAIN only, never the product's names
//
// An Israeli buyer typing the manufacturer's name the way they say it matched
// nothing at all. Same shape as the SPYQE/ספייק gap this repo already paid for.
//
// ── WHAT THIS FILE DOES NOT DO ───────────────────────────────────────────────
// It does not check that terms appear OFTEN. Frequency is not the goal and past a
// point it is a penalty: IDF collapses and length normalisation punishes padding.
// It checks that the entity is NAMEABLE — the right name, in the right slot,
// derived from one source — which is what actually resolves a query to a page.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  MANUFACTURER_NAME,
  MANUFACTURER_NAME_HE,
  PRODUCT_ALTERNATE_NAMES,
  PRODUCT_CATEGORY_HE,
  PRODUCT_NAME,
  PRODUCT_NAME_HE,
} from "../lib/content";

const read = (f: string) => readFileSync(f, "utf8");

/** Code with comments stripped. The rules below are about what the site EMITS;
 *  a comment recording the old wrong name is documentation, not a claim, and a
 *  guard that cannot tell the two apart fires on its own explanation. Same
 *  technique the migrations gate uses for the same reason. */
const code = (f: string) =>
  read(f)
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, " ")
    .split("\n")
    .map((l) => l.replace(/\/\/.*$/, ""))
    .join("\n");
const layout = read("app/layout.tsx");
const llms = read("public/llms.txt");

describe("the product has one name, and it comes from a real source", () => {
  it('no surface calls it "MiaMe Four"', () => {
    // The mutation-provable core. This exact string was live in two places.
    for (const f of ["app/layout.tsx", "components/Hero.tsx", "lib/content.ts"]) {
      expect(code(f), `${f} still calls the product "MiaMe Four" — a name from no source`).not.toContain(
        "MiaMe Four",
      );
    }
    // llms.txt is prose end to end: no comments, so nothing to strip.
    expect(read("public/llms.txt"), "llms.txt still calls it \"MiaMe Four\"").not.toContain("MiaMe Four");
  });

  it("the naming constants are distinct and non-empty", () => {
    // A guard whose constants collapsed to "" would pass every check below.
    for (const [k, v] of Object.entries({
      PRODUCT_NAME, PRODUCT_NAME_HE, PRODUCT_CATEGORY_HE, MANUFACTURER_NAME, MANUFACTURER_NAME_HE,
    })) {
      expect(v.length, `${k} is empty`).toBeGreaterThan(2);
    }
    expect(PRODUCT_NAME).not.toBe(PRODUCT_NAME_HE);
    expect(PRODUCT_ALTERNATE_NAMES).toContain(PRODUCT_NAME);
    expect(PRODUCT_ALTERNATE_NAMES).toContain(PRODUCT_NAME_HE);
    // The bare Hebrew token, which is how the brand is often typed and which
    // appeared standalone nowhere on the site.
    expect(PRODUCT_ALTERNATE_NAMES).toContain("מיה");
  });
});

describe("the homepage title names what is being sold", () => {
  it("carries the Hebrew product name and the category", () => {
    // The most heavily weighted element on the strongest page. It used to read
    // "MiaMe · החופש שלך על ארבעה גלגלים" — a promise, naming nothing searchable.
    const block = layout.slice(layout.indexOf("title: {"), layout.indexOf("template:"));
    expect(block, "the title no longer derives the product name").toContain("PRODUCT_NAME_HE");
    expect(block, "the title no longer derives the category").toContain("PRODUCT_CATEGORY_HE");
  });

  it("the keywords are the real terms, and carry no claim the site contradicts", () => {
    const kw = layout.slice(layout.indexOf("keywords: ["), layout.indexOf("alternates:"));
    for (const c of ["PRODUCT_NAME_HE", "PRODUCT_NAME", "PRODUCT_CATEGORY_HE", "MANUFACTURER_NAME_HE"])
      expect(kw, `keywords lost ${c}`).toContain(c);
    // "רכב חשמלי" was there. The site's own legal page states this is a קלנועית
    // and NOT a רכב — a keyword that contradicts your compliance copy is a
    // liability before it is a missed ranking.
    expect(kw, 'keywords claim "רכב חשמלי", which the legal page contradicts').not.toContain("רכב חשמלי");
  });
});

describe("the schema resolves the entity instead of inventing one", () => {
  const product = layout.slice(layout.indexOf('"@type": "Product"'), layout.indexOf("additionalProperty"));

  it("names the product from the source, and declares what else it answers to", () => {
    expect(product).toContain("PRODUCT_NAME");
    // Anchored on the PRODUCT node's own alternateName, not merely the word:
    // `brand` carries one too, so a loose `toContain("alternateName")` passed
    // with the product's removed. Caught by mutation, which is why it is here.
    expect(
      product,
      "the Product node has no alternateName of its own — the Hebrew queries resolve to nothing",
    ).toMatch(/alternateName:\s*\[`\$\{PRODUCT_NAME_HE\}/);
    expect(product).toContain("PRODUCT_ALTERNATE_NAMES");
  });

  it("credits the manufacturer, in both scripts", () => {
    // Nothing declared a maker at all, so MIA Dynamics existed on the site as
    // prose and to a machine not at all.
    expect(product, "no manufacturer node").toContain("manufacturer");
    expect(product).toContain("MANUFACTURER_NAME_HE");
  });

  it('the brand is the product line, not the shop', () => {
    // `brand: MiaMe` told every engine the manufacturer's reputation belongs to
    // the retailer. The seller moves into the Offer, where schema.org puts it.
    expect(product, "brand is still hardcoded to the shop").not.toMatch(/brand:\s*\{[^}]*"MiaMe"/);
    expect(product, "the seller is no longer declared on the offer").toContain("seller");
  });
});

describe("llms.txt — what an answer engine reads directly", () => {
  it("names the product in both scripts and says what it is", () => {
    expect(llms).toContain(PRODUCT_NAME);
    expect(llms).toContain(PRODUCT_NAME_HE);
    expect(llms, "llms.txt never says what the product legally is").toContain(PRODUCT_CATEGORY_HE);
  });

  it("names the manufacturer in both scripts", () => {
    expect(llms).toContain(MANUFACTURER_NAME);
    // The Hebrew name must be an actual transliteration of Dynamics, checked
    // BEFORE it is looked for in the file. Without this the constant could be
    // set to "מיה" — already a substring of מיה פור — and every occurrence check
    // would pass while the manufacturer stayed unnameable. Mutation found it.
    expect(
      MANUFACTURER_NAME_HE,
      `"${MANUFACTURER_NAME_HE}" does not transliterate ${MANUFACTURER_NAME}`,
    ).toMatch(/די{1,2}נמיקס/);
    expect(llms, "the manufacturer still has no Hebrew name for an answer engine").toContain(
      MANUFACTURER_NAME_HE,
    );
  });
});
