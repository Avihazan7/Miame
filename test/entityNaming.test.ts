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
import { readFileSync, readdirSync } from "node:fs";
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

/** Every .ts/.tsx the site actually serves. The list below used to be three
 *  hand-written filenames, and that is precisely how the banned name survived:
 *  app/legal/terms/page.tsx said "מוצרי MiaMe Four" for eight days after the name
 *  was purged from schema and llms.txt, because nobody added the legal pages to a
 *  literal array. A rule that matters is swept for, not enumerated. */
function servedFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = `${dir}/${e.name}`;
      if (e.isDirectory()) {
        if (e.name === "node_modules" || e.name.startsWith(".")) continue;
        walk(full);
      } else if (e.name.endsWith(".ts") || e.name.endsWith(".tsx")) out.push(full);
    }
  };
  for (const root of ["app", "components", "lib", "brain"]) walk(root);
  return out;
}

describe("the product has one name, and it comes from a real source", () => {
  it('NO served file calls it "MiaMe Four"', () => {
    // The mutation-provable core. This exact string was live in two machine-readable
    // surfaces, purged 2026-09-01 — and then found again on 2026-09-09 in the legal
    // terms, which the old three-file list did not cover.
    const offenders = servedFiles().filter((f) => code(f).includes("MiaMe Four"));
    expect(
      offenders,
      `these call the product "MiaMe Four" — the SITE's name welded onto the PRODUCT's, ` +
        `a name that exists in no source: ${offenders.join(", ")}`,
    ).toEqual([]);
    // llms.txt is prose end to end: no comments, so nothing to strip.
    expect(read("public/llms.txt"), "llms.txt still calls it \"MiaMe Four\"").not.toContain("MiaMe Four");
  });

  /**
   * THE STORE IS NOT THE VEHICLE.
   *
   * OWNER, 2026-09-09: "הסירטון על MIA FOUR ולא על MiaMe." MiaMe Ⓜ️ is an online
   * STORE brand — it markets and sells vehicles built by MIA Dynamics: MIA FOUR
   * today, SPYQE next. So a sentence may say the shop sells, delivers, answers or
   * is written to; it may NOT say the shop is what moves, what feels, or what the
   * film is about. Those belong to the product.
   *
   * Two live sentences failed this on 2026-09-09 — the Cinema block the owner
   * struck out, and a second one in FreedomMomentVideo that no screenshot showed.
   * The second is the reason this is a swept rule and not a one-line fix.
   */
  it("no copy makes the STORE the thing that moves or feels", () => {
    // Verbs of embodiment: what a VEHICLE does, never what a shop does.
    const EMBODIES = ["שמובילה את", "שמובילים את", "שמגדירים את", "שמגדיר את", "שמגדירה את"];
    const bad: string[] = [];
    for (const f of servedFiles()) {
      const src = code(f);
      for (const verb of EMBODIES) {
        // the site name, straight after the verb, with nothing but spaces between
        const re = new RegExp(`${verb}\\s+(?:את\\s+)?MiaMe\\b`);
        if (re.test(src)) bad.push(`${f} — "${verb} MiaMe"`);
      }
    }
    expect(
      bad,
      `MiaMe is the store, not the vehicle. Name the product (PRODUCT_NAME_HE) as the ` +
        `subject instead: ${bad.join(" · ")}`,
    ).toEqual([]);
  });

  /**
   * …AND THE STORE IS NOT WHAT WAS BORN.
   *
   * The other half of the same error, and the reason this rule got a second clause:
   * the About paragraph opened "MiaMe.co.il נולדה מתוך אמונה פשוטה" until the owner
   * struck it on 2026-09-09 — "במקום MiaMe.co.il לרשום מיה פור". The first clause
   * above only catches the shop AFTER the verb; here the shop is the SUBJECT, before
   * it. A belief gives rise to a product, and a shop is what brings it to you.
   */
  it("no copy makes the STORE the thing that was born", () => {
    // Birth/origin predicates, with the site name as their subject.
    const BORN = ["נולדה", "נולד", "קמה", "קם לחיים"];
    const bad: string[] = [];
    for (const f of servedFiles()) {
      const src = code(f);
      for (const verb of BORN) {
        // MiaMe (optionally .co.il, optionally closing a tag) then the verb.
        //
        // The terminator is (?![א-ת]) and NOT \b, and that distinction is the whole
        // rule: JavaScript defines \b on \w = [A-Za-z0-9_], so after a Hebrew letter
        // there is no word boundary at all and `${verb}\b` NEVER matches. The first
        // version of this gate ended in \b, passed its own suite, and passed the
        // mutation that restored the exact sentence the owner had struck — a gate
        // that cannot fire, reporting green. Caught only because the mutation was
        // actually run. Hebrew rules need Hebrew terminators.
        const re = new RegExp(`MiaMe(?:\\.co\\.il)?\\s*(?:</\\w+>)?\\s+${verb}(?![א-ת])`);
        if (re.test(src)) bad.push(`${f} — "MiaMe … ${verb}"`);
      }
    }
    expect(
      bad,
      `MiaMe is the store — it was not born out of a belief, the product was. ` +
        `Name PRODUCT_NAME_HE as the subject: ${bad.join(" · ")}`,
    ).toEqual([]);
  });

  it("the About paragraph opens on the product, derived", () => {
    const src = code("components/About.tsx");
    expect(src, "About.tsx does not import the product name").toContain("PRODUCT_NAME_HE");
    expect(src, "About.tsx spells the product name instead of deriving it")
      .not.toMatch(new RegExp(`>${PRODUCT_NAME_HE}<`));
  });

  it("the two video blocks name the product, and derive it", () => {
    // Both carried the defect; both must now read the name from lib/content.ts
    // rather than spell it, so a rename cannot half-land.
    for (const f of ["components/CinematicVideo.tsx", "components/FreedomMomentVideo.tsx"]) {
      const src = code(f);
      expect(src, `${f} does not import the product name`).toContain("PRODUCT_NAME_HE");
      expect(src, `${f} hard-codes the Hebrew product name instead of deriving it`)
        .not.toMatch(new RegExp(`["'>\\s]${PRODUCT_NAME_HE}[<"'\\s,.]`));
    }
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
    // And the category-led form: a buyer who leads with what the thing IS rather
    // than with the brand types "קלנועית מיה". It earns the query as an alternate
    // name; it is deliberately NOT forced into any sentence.
    expect(PRODUCT_ALTERNATE_NAMES).toContain(`${PRODUCT_CATEGORY_HE} מיה`);
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

describe("the H1 names what is being sold", () => {
  const hero = read("components/Hero.tsx");

  it("carries the product name and the category inside the heading", () => {
    // It has to be INSIDE the <h1> to count as heading text. The two large lines
    // stay; this is the small line above them.
    // The CONTENT, not the whole element: the opening tag carries aria-label,
    // which also names the product, so slicing from "<h1" passed with the naming
    // line deleted. Mutation found that; this starts after the tag closes.
    const open = hero.indexOf("<h1");
    const h1 = hero.slice(hero.indexOf(">", open) + 1, hero.indexOf("</h1>"));
    expect(h1, "the H1 does not name the product").toContain(PRODUCT_NAME_HE);
    expect(h1, "the H1 does not say what the product is").toContain(PRODUCT_CATEGORY_HE);
  });

  it("the accessible name IS the visible text — no aria-label standing in for it", () => {
    // Until 2026-09-08 the H1 was three spans, all aria-hidden, with an aria-label
    // carrying the real name: a sighted visitor read poetry and a screen reader
    // heard the product. The owner struck the poetry off a live screenshot, so the
    // H1 is now one line of ordinary text — which is the shape that cannot drift,
    // because there is only one string. An aria-label here would re-open the gap.
    const h1 = hero.slice(hero.indexOf("<h1"), hero.indexOf("</h1>"));
    expect(h1, "the H1 carries an aria-label again — the visible text is the name").not.toContain("aria-label");
    expect(h1, "part of the H1 is hidden from assistive tech").not.toContain("aria-hidden");
  });

  it("the H1 is one quiet naming line, not a headline the product must compete with", () => {
    // The product leads the screen now. A 74px clamp on this line would put the
    // copy back on top of the vehicle the owner moved up.
    const css = read("app/miame-hero-v2.css");
    const at = css.indexOf(".hero-v2-title {");
    const rule = css.slice(at, css.indexOf("}", at));
    const ceiling = Number(/font-size:\s*clamp\([^,]*,[^,]*,\s*(\d+(?:\.\d+)?)px\s*\)/.exec(rule)?.[1]);
    expect(ceiling, "the H1 has no clamped size").toBeGreaterThan(0);
    expect(ceiling, "the H1 is back to headline scale").toBeLessThanOrEqual(34);
  });
});

describe("the snippet names the thing, not only the title", () => {
  // The title and the H1 were both fixed on 2026-09-01. The DESCRIPTION was not
  // re-read, and until 2026-09-08 it opened on "ניידות חשמלית פרימיום" — the very
  // phrase the H1 comment calls one nobody searches — while naming neither the
  // product nor the category. That string is what Google prints under the title
  // on every result for the domain, and what an answer engine quotes. A title
  // that resolves the entity beside a description that does not is half a fix.
  const meta = layout.slice(layout.indexOf("export const metadata"), layout.indexOf("openGraph:"));
  /** The same slice with comments stripped. `meta` keeps them because two assertions
   *  below deliberately read the SOURCE (they check a value is a template literal that
   *  interpolates a constant, which only the source shows). The "בנה" rule must not:
   *  the comment above that very description says '…not "בנה"', so a rule that reads
   *  comments fires on its own explanation — which is exactly the trap this file's
   *  `code()` helper was written for, and which the broken \b had been hiding. */
  const metaCode = code("app/layout.tsx").slice(
    code("app/layout.tsx").indexOf("export const metadata"),
    code("app/layout.tsx").indexOf("openGraph:"),
  );

  it("the site description names the product and the category", () => {
    const desc = /description:\s*\n?\s*`([^`]+)`/.exec(meta)?.[1] ?? "";
    expect(desc, "the site description is no longer a template literal").not.toBe("");
    expect(desc, "the description does not name the product").toContain("${PRODUCT_NAME_HE}");
    expect(desc, "the description does not say what the product is").toContain("${PRODUCT_CATEGORY_HE}");
  });

  it("no public description opens on the phrase nobody searches", () => {
    // Not a ban on the words — a ban on LEADING with them where the product and
    // the category are what a person typed.
    for (const [file, src] of [["app/layout.tsx", layout], ["lib/seo-pages.ts", read("lib/seo-pages.ts")]] as const) {
      for (const m of src.matchAll(/description:\s*\n?\s*["`']([^"`']+)["`']/g)) {
        expect(m[1].startsWith("ניידות חשמלית"), `${file}: a description opens on "ניידות חשמלית"`).toBe(false);
      }
    }
  });

  it("its call to action is plural, like every other one on the site", () => {
    // "בנה" is masculine singular; the site says "בנו" · "צפו" · "גררו".
    //
    // THIS ASSERTION USED TO READ /\bבנה\b/ AND COULD NEVER FAIL. JavaScript defines
    // \b on \w = [A-Za-z0-9_], so a Hebrew letter is never a word character and there
    // is no boundary beside one: /\bבנה\b/.test("בנה") is FALSE — it does not match
    // even the bare word it names. Found 2026-09-09 by sweeping the repo for \b next
    // to Hebrew, after the same mistake was caught by mutation in the store/product
    // rule above. Lookarounds on the Hebrew block are the working form, and both
    // sides are needed: without the lookbehind this fires inside "נבנה", without the
    // lookahead inside "בנהל".
    expect(metaCode, "the description addresses one man").not.toMatch(/(?<![א-ת])בנה(?![א-ת])/);
  });
});

describe("llms.txt opens with the entity, and answers what it is asked", () => {
  // An answer engine reads the first lines of llms.txt as the definition of the
  // site. Until 2026-09-08 they were "MiaMe — החופש שלך על ארבעה גלגלים" and a
  // blockquote opening on "ניידות חשמלית פרימיום": a poem and a phrase nobody
  // searches, on the two lines that decide how the entity is resolved.
  const head = llms.slice(0, llms.indexOf("## מוצר"));

  it("the heading and the summary both name the product and the category", () => {
    expect(head).toContain(PRODUCT_NAME_HE);
    expect(head).toContain(PRODUCT_NAME);
    expect(head).toContain(PRODUCT_CATEGORY_HE);
    expect(head.startsWith("# " + PRODUCT_NAME_HE), "the H1 of llms.txt does not open on the product").toBe(true);
  });

  it("carries the two facts a buyer asks before price: is it a vehicle, and is it covered", () => {
    // The site's own legal page is explicit that MIA FOUR is a קלנועית and NOT a
    // רכב — the single most-asked question, and the one an answer engine is most
    // likely to get wrong from a competitor's page.
    expect(llms, "llms.txt does not state the legal status").toMatch(/מעמד חוקי/);
    expect(llms).toMatch(/אינה רכב/);
    expect(llms, "llms.txt does not state the warranty term").toMatch(/אחריות ושירות \d+ חודשים/);
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
