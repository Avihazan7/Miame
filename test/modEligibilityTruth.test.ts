// test/modEligibilityTruth.test.ts — what the site may and may not say about
// Ministry of Defence funding.
//
// This is the most legally exposed copy on the site. A נכה צה"ל reading it is
// deciding whether to spend 20,000–28,000 ₪ on the strength of what a government
// department will reimburse, and MiaMe is not a party to that decision.
//
// TWO DEFECTS FOUND ON 2026-09-10, both in lib/eligibility.ts, both introduced by
// the same author who wrote the rule they broke:
//
// 1. BLANKET ATTRIBUTION. Three passages said every subsidy figure on the page is
//    "לפי פרסומי האגפים" / "המספרים שהאגף עצמו מפרסם". They are not. The frozen
//    disclaimer in components/Tribute.tsx decomposes "עד 100%" itself: a recognised
//    subsidy of up to 90% from the Ministry, PLUS a 10% MEU grant which that same
//    disclaimer calls "הטבת רשות … וניתן לשינוי או להפסקה בכל עת". So the page
//    attributed to a government body a commitment only an importer had made, and
//    could revoke. A reader who saw "עד 100% מוכר לסבסוד" beside "כל מספר … לפי
//    פרסומי האגפים" would conclude the Ministry recognises the whole price.
//
// 2. THE FROZEN FIGURES, PUBLISHED FROM A SECOND FILE. lib/eligibility.ts states
//    its own rule at the top — "The frozen figures … are NOT restated here … One
//    number, one home" — and then restated 90% and 10% in a FAQ answer. That answer
//    is also emitted as FAQPage JSON-LD, so the pair was being published to Google
//    from a file no legal review would think to open.
//
// Neither fix touched a frozen number. Both are enforced below, mechanically,
// because both survived a human reading of the same file that declared the rule.
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

const HOME = "components/Tribute.tsx";
const ALL = [...sources("app"), ...sources("lib"), ...sources("components")];

describe("one number, one home", () => {
  /** The four figures components/Tribute.tsx declares legally reviewed and frozen.
   *  Each pattern is written to match the FIGURE IN ITS CLAIM, not a bare percentage
   *  — "10%" alone appears in CSS gradients and in an unrelated image-sizing note,
   *  and a gate that fired on those would be turned off within a week. */
  const FROZEN: [label: string, re: RegExp][] = [
    ["17,988 ₪ (bereaved-family grant)", /17,988/],
    ['the "עד 100%" framing', /עד 100%/],
    ["the 90% recognised subsidy", /עד 90%|90% מוכר/],
    ["the 10% MEU grant", /בשיעור 10%|10%\s*מענק|מענק[^.]{0,30}10%/],
  ];

  for (const [label, re] of FROZEN) {
    it(`${label} is written only in ${HOME}`, () => {
      const elsewhere = ALL.filter((f) => f !== HOME && re.test(code(readFileSync(f, "utf8"))));
      expect(
        elsewhere,
        `a legally reviewed figure is restated in: ${elsewhere.join(", ")} — ` +
          `a fresh legal read moves it in ${HOME} and leaves these stale`,
      ).toEqual([]);
    });
  }

  it(`${HOME} still carries all four, so this gate is guarding something`, () => {
    const home = code(readFileSync(HOME, "utf8"));
    for (const [label, re] of FROZEN) {
      expect(re.test(home), `${label} has left ${HOME} — has the frozen block moved?`).toBe(true);
    }
  });
});

describe("the site never attributes the importer's grant to the Ministry", () => {
  const ELIGIBILITY = code(readFileSync("lib/eligibility.ts", "utf8"));

  it("no passage generalises every figure to the departments' publications", () => {
    // The exact shape that shipped: a sweeping "כל מספר … לפי פרסומי האגפים".
    // Both spellings that appeared are covered, plus the noun form.
    const blanket = /כל מספר[^"]{0,80}(?:לפי (?:מה שהאגפים מפרסמים|פרסומי האגפים)|שהאגף עצמו מפרסם)/;
    expect(blanket.test(ELIGIBILITY)).toBe(false);
  });

  it("wherever the copy generalises over figures, it names the grant as discretionary", () => {
    // The positive half. Banning the old sentence is not enough — the page must still
    // tell the reader WHICH part the Ministry stands behind, or removing the claim
    // just removes the information.
    // THE UNIT IS THE PASSAGE, NOT THE TEXT AFTER THE PHRASE. The first version of
    // this assertion scanned forward from "כל מספר" and failed on copy that was
    // correct: in the FAQ answer the qualification is stated BEFORE the
    // generalisation, which is the more natural Hebrew order. A gate that only reads
    // forward would have pushed the copy into a worse sentence to satisfy it.
    // A double-quoted string literal is what an answer engine lifts as one passage,
    // and it is the unit the qualification has to travel with.
    const literals = ELIGIBILITY.match(/"(?:[^"\\]|\\.)*"/g) ?? [];
    const generalisations = literals.filter((l) => l.includes("כל מספר"));
    expect(generalisations.length).toBeGreaterThanOrEqual(2);
    for (const g of generalisations) {
      expect(
        /מענק רשות/.test(g),
        `a passage generalises over the figures without saying the top-up is discretionary: ${g.slice(0, 140)}`,
      ).toBe(true);
    }
  });
});

describe("MiaMe never claims the department's role", () => {
  // The permitted register is "we serve this audience" and "this product may suit
  // you". Never "you are entitled" and never "we run the process for you". These are
  // the assertion shapes; each one is a sentence a reader could act on and lose money.
  const FORBIDDEN: [claim: string, re: RegExp][] = [
    ["tells the reader they ARE entitled", /אתם זכאים|אתה זכאי|את זכאית|מגיע לכם מימון/],
    ["promises funding", /מימון מובטח|נדאג למימון|נשיג לכם (?:את ה)?מימון/],
    ["claims to run the claim", /מגישים עבורכם|נגיש עבורכם|מנהלים עבורכם|מטפלים עבורכם/],
    ["claims to decide eligibility", /אנחנו קובעים (?:את ה)?זכאות|נאשר לכם (?:את ה)?זכאות/],
  ];
  for (const [claim, re] of FORBIDDEN) {
    it(`no surface ${claim}`, () => {
      const hits = ALL.filter((f) => re.test(code(readFileSync(f, "utf8"))));
      expect(hits).toEqual([]);
    });
  }
});
