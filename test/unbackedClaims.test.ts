// test/unbackedClaims.test.ts — claims the site cannot back do not ship.
//
// Four defects, all found by mapping every commercial claim in the tree back to the
// module that holds it and to every surface that renders it (2026-09-10). The money
// itself was clean — every SPYQE figure derived, prices locked to lib/models.ts, no
// invented priceValidUntil, no fake stock counter. What broke was the claims that
// carry no number and therefore no gate.
//
// 1. FREE SHIPPING WITH NO SOURCE. components/Features.tsx rendered "משלוח MIA FOUR עד
//    אליכם, עלינו." — an absolute cost promise, unqualified, on a site where every
//    other figure carries a caveat. It appears in NO other place: not app/legal/terms
//    (whose §5 covers delivery timing and never price), not components/Service.tsx (the
//    dedicated delivery section: "מסירה בכל הארץ · מתואמת אתכם מראש מול נציג"), not
//    public/llms.txt, not the brain corpus, not lib/content.ts.
//
// 2. A FABRICATED POPULARITY BADGE. components/Configurator.tsx crowned a model "הכי
//    מבוקש" on `i === 1` — decided by a position in an array, with no sales figure,
//    no analytics field and no model property behind it. And two surfaces disagreed:
//    lib/seo-pages.ts calls 2×4 City (index 0) "נקודת הכניסה הפופולרית". A claim about
//    what other buyers chose is the strongest social lever on the model-picker screen.
//
// 3+4. AN ABSOLUTE EXEMPTION FROM TRAFFIC FINES. The reviewed wording lives in
//    components/LegalStatus.tsx's card: "אינה חשופה לחלק מהקנסות … בכפוף לדין". Two
//    surfaces stated it absolutely instead — the section's own lede two paragraphs
//    above the card, and brain/knowledge.ts's offline row, which is served exactly when
//    no live corpus exists to correct it. "פטורה" and "אינה חשופה לחלק מ…" are not the
//    same claim: the first tells a buyer they cannot be fined.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const code = (src: string) =>
  src
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");

function sources(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) sources(p, acc);
    else if (/\.tsx?$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const ALL = [...sources("app"), ...sources("lib"), ...sources("components"), ...sources("brain")];
const read = (f: string) => code(readFileSync(f, "utf8"));

describe("no surface promises a cost the terms do not back", () => {
  it("nothing declares delivery free", () => {
    // "עלינו" / "חינם" / "ללא עלות" beside delivery. `ללא עלות` is deliberately NOT
    // banned outright — components/Tribute.tsx uses it for the MoD worksheet's bottom
    // line, where the frozen disclaimer backs it in the same block — so the pattern
    // requires a delivery word nearby.
    const NEARBY = /(משלוח|מסירה|הובלה)[^.]{0,80}(עלינו|חינם|ללא עלות)|(עלינו|חינם|ללא עלות)[^.]{0,80}(משלוח|מסירה|הובלה)/;
    const hits = ALL.filter((f) => NEARBY.test(read(f)));
    expect(
      hits,
      `delivery is promised free in: ${hits.join(", ")} — app/legal/terms §5 covers ` +
        `delivery timing and says nothing about price, so nothing backs this`,
    ).toEqual([]);
  });
});

describe("no surface claims popularity it cannot measure", () => {
  it("no badge or label asserts what other buyers chose", () => {
    // A demand claim needs a field. Until one exists, the phrase does not.
    const DEMAND = /הכי מבוקש|הנמכר ביותר|הבחירה של רוב|הפופולרי ביותר/;
    const hits = ALL.filter((f) => DEMAND.test(read(f)));
    expect(hits, `a popularity claim with no data source is rendered in: ${hits.join(", ")}`).toEqual([]);
  });
});

describe("the traffic-fine claim keeps its qualification on every surface", () => {
  const FINES = /(דוחות|קנסות)/;
  const surfaces = ALL.filter((f) => FINES.test(read(f)));

  it("at least the known surfaces still discuss it", () => {
    expect(surfaces.length, "nothing mentions fines — has the section been renamed?").toBeGreaterThanOrEqual(2);
  });

  it("no surface states an unconditional exemption", () => {
    // The two shapes that shipped: "פטורה מהדוחות" and "בלי הדוחות".
    const ABSOLUTE = /פטור[הת]?\s+מ[הן]?דוחות|פטור[הת]?\s+מ[הן]?קנסות|בלי\s+הדוחות|ללא\s+דוחות/;
    const hits = surfaces.filter((f) => ABSOLUTE.test(read(f)));
    expect(
      hits,
      `an unconditional exemption from traffic fines is stated in: ${hits.join(", ")} — ` +
        `the reviewed wording is "אינה חשופה לחלק מהקנסות … בכפוף לדין"`,
    ).toEqual([]);
  });

  it("every surface that mentions fines also carries the qualifier", () => {
    const QUALIFIED = /בכפוף לדין|בכפוף לתקנות|חלק מהקנסות|פחות חשיפה/;
    const bare = surfaces.filter((f) => !QUALIFIED.test(read(f)));
    expect(bare, `fines are discussed without any qualification in: ${bare.join(", ")}`).toEqual([]);
  });
});
