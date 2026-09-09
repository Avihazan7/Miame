// test/heroMarkAndSpec.test.ts — the two things the owner asked to see on the
// stage on 2026-09-09, held to what a screenshot review would miss.
//
//   "נכנס לעמוד מקבל ורואה MIA FOUR הלוגו ליד הכלי למעלה בגודל עדין"
//   "ה w 1800 × 4 מנועים תוריד מתחת וליד הכלי"
//
// Both landed wrong on the first pass, and both failures were INVISIBLE to the
// numbers I had already collected — only a screenshot, read back, showed them.
// So each clause below is the specific defect that shipped, not a restatement of
// the intent:
//
// 1. THE ISOLATE SWALLOWED THE HEBREW. `<bdi dir="ltr">עד 4×1,800W</bdi>` renders
//    "1,800×4 עדW" — operands reversed, the W stranded. UAX#9 W7 promotes a
//    European number to L only when the strong type found searching BACKWARD is
//    L; with "עד" inside the isolate that search hits Hebrew, the digits stay EN,
//    and N1 then resolves the "×" between two EN runs to R. Excluding the Hebrew
//    makes the isolate's sos L, W7 fires, and the run is plain LTR. A gate that
//    merely asserted "there is a dir=ltr" would have passed the broken build.
// 2. `dir` ON THE POSITIONED BOX flips its own logical properties, so
//    inset-inline-start resolved LEFT and the chip stacked on .hero-v2-free-chip
//    at every breakpoint instead of mirroring it.
// 3. "עדין" IS A SIZE, AND THE FIRST SIZE WAS NOT IT. 132/108px read as a
//    headline — a third as wide as the product. The mark must stay a minority of
//    its own stage.
// 4. A `sizes` THAT OVERSTATES THE SLOT. The first pass declared 132/168px for a
//    104/78px box and pulled w=640 onto a phone. sizes describes the slot.
// 5. THE FIGURE RETYPED. "4×1,800W" must be READ from lib/models.ts, so a spec
//    change in the manifest cannot leave a stale number on the hero.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { getModel } from "../lib/models";

const read = (p: string) => readFileSync(p, "utf8");
const tsx = read("components/Hero.tsx");
/** Hero.tsx with every comment removed — a rule proven by a sentence in a comment
 *  is not proven. Every assertion below reads code the browser also reads. */
const code = tsx
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/(^|[^:])\/\/.*$/gm, "$1");
const css = read("app/miame-hero-v2.css").replace(/\/\*[\s\S]*?\*\//g, " ");

/** The stylesheet with every @media block LIFTED OUT, and the ≤560 block on its own.
 *  Reading them together is how the first version of this gate fooled itself: it
 *  matched `.hero-v2-mark` inside the phone media query, called it the base rule,
 *  and then asserted the base width was smaller than itself. A media query is a
 *  different rule for a different viewport, not a later declaration on the same one. */
function lift(source: string) {
  const media: Record<string, string> = {};
  let base = "";
  let i = 0;
  while (i < source.length) {
    const at = source.indexOf("@media", i);
    if (at === -1) { base += source.slice(i); break; }
    base += source.slice(i, at);
    const open = source.indexOf("{", at);
    let depth = 0, j = open;
    for (; j < source.length; j++) {
      if (source[j] === "{") depth++;
      else if (source[j] === "}" && --depth === 0) break;
    }
    media[source.slice(at, open).trim()] = source.slice(open + 1, j);
    i = j + 1;
  }
  return { base, media };
}
const SHEET = lift(css);
const PHONE = Object.entries(SHEET.media).find(([q]) => /max-width:\s*560px/.test(q))?.[1] ?? "";

const RULES = [...SHEET.base.matchAll(/([^{}@][^{}]*)\{([^{}]*)\}/g)].map((m) => [m[1].trim(), m[2]] as const);
const PHONE_RULES = [...PHONE.matchAll(/([^{}@][^{}]*)\{([^{}]*)\}/g)].map((m) => [m[1].trim(), m[2]] as const);
/** Every declaration block for a selector, in cascade order — the LAST one wins,
 *  and a rule that exists in an earlier block but is overwritten later is not the
 *  rule the browser applies. (A previous slider regression in this repo was
 *  exactly that: a shorthand in a later stylesheet resetting an earlier longhand.) */
function pick(rules: readonly (readonly [string, string])[], sel: string, prop: string): string | null {
  let found: string | null = null;
  for (const [s, b] of rules) {
    if (s !== sel) continue;
    const m = [...b.matchAll(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, "g"))];
    if (m.length) found = m[m.length - 1][1].trim();
  }
  return found;
}
/** the declaration outside any media query — what a desktop applies */
const decl = (sel: string, prop: string) => pick(RULES, sel, prop);
/** the declaration inside @media (max-width: 560px) — what a phone applies on top */
const phoneDecl = (sel: string, prop: string) => pick(PHONE_RULES, sel, prop);
const px = (v: string | null) => (v ? Number(v.replace("px", "")) : NaN);

/** The <Image …/> element carrying a class, as written. */
function tag(cls: string): string {
  const at = code.indexOf(`className="${cls}"`);
  expect(at, `no element carries class ${cls}`).toBeGreaterThan(-1);
  const open = code.lastIndexOf("<", at);
  const close = code.indexOf("/>", at);
  return code.slice(open, close + 2);
}

describe("the product mark — 'הלוגו ליד הכלי למעלה בגודל עדין'", () => {
  const mark = tag("hero-v2-mark");

  it("is the MIA FOUR wordmark, through the optimizer", () => {
    expect(mark).toContain('src="/mia-four-logo.webp"');
    expect(mark.startsWith("<Image"), "a raw <img> ships the whole 1600×599 original").toBe(true);
  });

  it("is decorative in the accessibility tree — the h1 already names the product", () => {
    // "מיה פור - קלנועית - MIA FOUR" is read out immediately below it. A second
    // announcement of the same name is noise, not information.
    expect(mark).toMatch(/alt=""/);
    expect(mark).toMatch(/aria-hidden=(\{true\}|"true")/);
    expect(code).toMatch(/MIA FOUR/);
  });

  it("stays a minority of the stage it stands on — 'עדין' is a size", () => {
    const wide = px(decl(".hero-v2-mark", "width"));
    expect(wide).toBeGreaterThan(0);
    // The product box is 502px wide at ≥1120 and 354px on a 390 phone (measured
    // 2026-09-09). A mark past a quarter of it stops reading as a mark.
    expect(wide / 502, `${wide}px on a 502px stage reads as a headline`).toBeLessThan(0.25);
    const narrow = px(phoneDecl(".hero-v2-mark", "width"));
    expect(narrow, "no phone width for the mark").toBeGreaterThan(0);
    expect(narrow).toBeLessThan(wide);
    expect(narrow / 354, `${narrow}px on a 354px stage reads as a headline`).toBeLessThan(0.25);
  });

  it("declares the slot it actually occupies, not a larger one", () => {
    // An overstated sizes= is invisible on screen and costs bytes on every phone:
    // the first pass claimed 132px for a 78px box and pulled w=640 instead of w=256.
    const sizes = mark.match(/sizes="([^"]+)"/)?.[1] ?? "";
    const wide = px(decl(".hero-v2-mark", "width"));
    const narrow = px(phoneDecl(".hero-v2-mark", "width"));
    // "(max-width: 560px) 78px, 104px" → the condition's own px is not a slot width.
    const [phone, desk] = sizes
      .split(",")
      .map((part) => part.replace(/\([^)]*\)/g, "").match(/(\d+)px/)?.[1])
      .map((n) => Number(n));
    expect({ phone, desk }, `sizes="${sizes}" does not describe ${narrow}px / ${wide}px`).toEqual({
      phone: narrow,
      desk: wide,
    });
    expect(sizes, "the sizes breakpoint must be the CSS breakpoint").toContain("max-width: 560px");
  });

  it("cannot move the product — it is out of flow, above the plane, inert to the pointer", () => {
    expect(decl(".hero-v2-mark", "position")).toBe("absolute");
    expect(decl(".hero-v2-mark", "pointer-events")).toBe("none");
    expect(Number(decl(".hero-v2-mark", "z-index"))).toBeGreaterThanOrEqual(4);
    expect(decl(".hero-v2-mark", "height")).toBe("auto");
  });
});

describe("the power spec — 'ה w 1800 × 4 מנועים תוריד מתחת וליד הכלי'", () => {
  it("reads its figure from lib/models.ts and never retypes it", () => {
    const highlight = getModel("4x4").highlights.find((h) => /W\b/.test(h)) ?? "";
    expect(highlight, "the 4×4 manifest lost its power highlight").toMatch(/1,800W/);
    expect(code, "the hero must derive the figure, not restate it").toContain('getModel("4x4")');
    // The literal must NOT appear in Hero.tsx: if it did, a manifest change would
    // leave a stale number on the most-seen surface on the site.
    expect(code.includes("1,800W"), "Hero.tsx hard-codes the wattage").toBe(false);
  });

  it("sits BELOW the vehicle and mirrors FREE FEEL across the stage", () => {
    // "מתחת וליד הכלי". Before 2026-09-08 this chip lived at inset-block-START;
    // the owner asked for it below. It must also take the opposite inline edge
    // from the FREE FEEL chip, or the two stack in one corner.
    expect(decl(".hero-v2-power-chip", "inset-block-end")).toBeTruthy();
    expect(decl(".hero-v2-power-chip", "inset-block-start")).toBe(null);
    expect(decl(".hero-v2-power-chip", "inset-inline-start")).toBeTruthy();
    expect(decl(".hero-v2-free-chip", "inset-inline-end")).toBeTruthy();
    expect(decl(".hero-v2-power-chip", "inset-inline-end")).toBe(null);
    expect(decl(".hero-v2-free-chip", "inset-inline-start")).toBe(null);
  });

  it("puts the bidi isolate on the Latin run ONLY — never around the Hebrew", () => {
    // The defect: <bdi dir="ltr">עד 4×1,800W</bdi> renders "1,800×4 עדW".
    // With Hebrew inside the isolate, UAX#9 W7 cannot promote the digits to L,
    // and N1 resolves the "×" between two EN runs to R.
    const chip = code.slice(code.indexOf('className="hero-v2-power-chip"'));
    const body = chip.slice(0, chip.indexOf("</div>"));
    const isolate = body.match(/<(b|bdi|span)\s+dir="ltr"\s*>([\s\S]*?)<\/\1>/);
    expect(isolate, "the figure carries no LTR isolate at all").toBeTruthy();
    const inside = isolate![2];
    expect(/[֐-׿]/.test(inside), `Hebrew inside the isolate: ${JSON.stringify(inside)}`).toBe(false);
    expect(inside).toContain("POWER_SPEC");
    // …and the Hebrew qualifier is still on the chip, outside that isolate.
    expect(/[֐-׿]/.test(body.replace(isolate![0], "")), "the qualifier went missing").toBe(true);
  });

  it("never puts dir on the positioned box itself", () => {
    // dir on the element flips ITS OWN logical properties: inset-inline-start
    // resolved LEFT and the chip landed on top of .hero-v2-free-chip.
    const open = code.slice(code.indexOf('<div className="hero-v2-power-chip"'));
    expect(open.slice(0, open.indexOf(">")).includes("dir=")).toBe(false);
  });

  it("is quieter than the FREE FEEL chip — a specification, not a second offer", () => {
    expect(decl(".hero-v2-power-chip", "background")).toMatch(/rgba\(255,\s*255,\s*255/);
    expect(decl(".hero-v2-free-chip", "background")).toMatch(/gradient/);
    expect(decl(".hero-v2-power-chip", "pointer-events")).toBe("none");
  });
});
