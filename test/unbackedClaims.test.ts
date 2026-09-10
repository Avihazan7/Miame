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

describe("the delivery promise is backed by the document that binds", () => {
  // THE RULE INVERTED ON 2026-09-10, AND THAT IS THE POINT. The first version of this
  // block banned the free-delivery claim outright, because at the time NOTHING backed
  // it. Then the owner stated the term: delivery and handover are included. A gate
  // whose job is truth must follow the truth — so what is enforced now is not silence
  // but SOURCING. The defect was never the claim; it was a claim with no document
  // behind it and six places it could have been written.
  const TERMS = readFileSync("app/legal/terms/page.tsx", "utf8");
  const CONTENT = readFileSync("lib/content.ts", "utf8");

  it("lib/content.ts is the one place the fact is written", () => {
    expect(CONTENT).toMatch(/export const DELIVERY_INCLUDED\b/);
    expect(CONTENT).toMatch(/export const DELIVERY_INCLUDED_NOTE\b/);
  });

  it("the binding document states it, and reads it from the constant", () => {
    // Not "the terms mention delivery" — §5 always did that, about TIMING. The clause
    // must render the shared sentence, so the contract cannot drift from the page.
    expect(TERMS).toMatch(/DELIVERY_INCLUDED_NOTE/);
    expect(TERMS).toMatch(/from "@\/lib\/content"/);
  });

  it("every surface that claims free delivery derives it, never writes it flat", () => {
    // A file may say "עלינו"/"חינם"/"כלולה במחיר" next to a delivery word only if it
    // also reads DELIVERY_INCLUDED (or the note). Writing the promise as a bare string
    // is exactly how it came to outlive its source last time.
    const CLAIM = /(משלוח|מסירה|הובלה)[^.]{0,80}(עלינו|חינם|ללא עלות|כלול)|(עלינו|חינם|ללא עלות|כלול)[^.]{0,80}(משלוח|מסירה|הובלה)/;
    const flat = ALL.filter((f) => f !== "lib/content.ts")
      .filter((f) => CLAIM.test(read(f)))
      .filter((f) => !/DELIVERY_INCLUDED/.test(read(f)));
    expect(
      flat,
      `delivery is promised free without reading lib/content.ts in: ${flat.join(", ")}`,
    ).toEqual([]);
  });

  it("every 'מסירה בכל הארץ' row derives the cost, none is silent about it", () => {
    // FOUND BY READING THE RENDERED PAGE (2026-09-10). Three surfaces were updated and
    // a FOURTH was missed — the assurance list inside components/Configurator.tsx,
    // directly above the lead form. It escaped the search that found the others
    // precisely because it made no cost claim: it was SILENT about price, on the panel
    // that quotes the monthly payment. Silence next to three surfaces that now say
    // "כלולה במחיר" reads as a different answer, so the row is in scope either way.
    // PROXIMITY, NOT FILE PRESENCE — and that distinction was proven, not assumed.
    // The first version asked only whether the FILE mentioned DELIVERY_INCLUDED
    // anywhere. Mutation-testing it showed the hole immediately: reverting the row to
    // its flat string left the `import { … DELIVERY_INCLUDED }` line untouched, the
    // file still "mentioned" the constant, and the gate stayed green on the exact
    // regression it exists to catch. The row has to derive, so the row is the window.
    const WINDOW = 200;
    const silent: string[] = [];
    for (const f of ALL) {
      const src = read(f);
      for (const m of src.matchAll(/מסירה בכל הארץ/g)) {
        const around = src.slice(m.index ?? 0, (m.index ?? 0) + WINDOW);
        if (!/DELIVERY_INCLUDED/.test(around)) silent.push(f);
      }
    }
    expect(
      [...new Set(silent)],
      `a nationwide-delivery row states no cost and derives no constant in: ${[...new Set(silent)].join(", ")}`,
    ).toEqual([]);
  });

  it("the Offer's shipping node and the copy are driven by the same switch", () => {
    // A zero shipping rate in JSON-LD is a commitment a machine reads as authoritative.
    // It must not be able to outlive the sentence a human reads.
    const LAYOUT = read("app/layout.tsx");
    if (/shippingDetails/.test(LAYOUT)) {
      expect(LAYOUT).toMatch(/DELIVERY_INCLUDED\s*\n?\s*\?/);
      expect(LAYOUT).toMatch(/shippingRate/);
    }
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
