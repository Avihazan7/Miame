// test/ctaLabelHonesty.test.ts — a button's label promises its own destination.
//
// THE DEFECT THIS CLOSES (audit, verified 2026-09-01). The cinema stage's primary CTA
// read "בדיקת התאמה בוואטסאפ" and went to `href="#sim"` — it scrolled to the payment
// simulator further down the same page. WhatsApp never opened. Everywhere else in this
// tree "בוואטסאפ" in a label marks a control that really does open WhatsApp (the
// Configurator's submit, the sticky bar's WA button, the floating button), and the
// three OTHER `#sim` anchors — StickyCta, Hero, FreedomMomentVideo — all read plain
// "בדיקת התאמה". One label had drifted out of the convention the rest of the site
// keeps, and a visitor who wanted to talk to a human got a scroll instead.
//
// SCOPE. A same-page fragment anchor is the one case where a static file can PROVE the
// promise is false: `#sim` is a scroll, categorically, whatever the handler does. This
// says nothing about <button onClick={…}> controls — deciding where those really go
// needs the call graph — so it deliberately checks the case it can settle rather than
// guessing at the case it cannot.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** The word that, in this tree, is a promise: "this control opens WhatsApp". */
const PROMISE = "בוואטסאפ";

function tsxFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) tsxFiles(p, acc);
    else if (entry.name.endsWith(".tsx")) acc.push(p);
  }
  return acc;
}

/** Anchors whose href is a same-page fragment, with the text they actually render.
 *  The tag scan is hand-rolled because these anchors carry inline arrow handlers —
 *  `onClick={() => …}` puts a `>` inside the attribute list, so the obvious
 *  `<a[^>]*>` regex stops in the middle of the tag and reads the wrong text. */
function fragmentAnchors(file: string): { href: string; text: string }[] {
  const src = readFileSync(file, "utf8");
  const out: { href: string; text: string }[] = [];
  const open =
    /<a((?:"[^"]*"|'[^']*'|\{(?:[^{}]|\{[^{}]*\})*\}|[^>"'])*?)(\/?)>/g;
  for (const m of src.matchAll(open)) {
    if (m[2] === "/") continue; // self-closing — renders no label
    const href = m[1].match(/href=(?:"(#[^"]*)"|\{"(#[^"]*)"\})/);
    if (!href) continue;
    const from = m.index! + m[0].length;
    const close = src.indexOf("</a>", from);
    if (close < 0) continue;
    const text = src
      .slice(from, close)
      .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, " ") // JSX comments
      .replace(/<[^>]*>/g, " ") // nested elements (icons)
      .replace(/\{[^{}]*\}/g, " ") // interpolations
      .replace(/\s+/g, " ")
      .trim();
    out.push({ href: href[1] ?? href[2]!, text });
  }
  return out;
}

describe("a label that says WhatsApp opens WhatsApp", () => {
  const files = [...tsxFiles("app"), ...tsxFiles("components")];
  const anchors = files.flatMap((f) => fragmentAnchors(f).map((a) => ({ file: f, ...a })));

  it("still finds the in-page CTAs (a blind guard is worse than none)", () => {
    // If the scan ever returns nothing — a regex slip, a renamed folder — every
    // assertion below passes vacuously and the guard becomes decoration.
    expect(anchors.length, "no same-page anchors found — the JSX scan is broken").toBeGreaterThanOrEqual(5);
    expect(
      anchors.some((a) => a.href === "#sim" && a.text.length > 0),
      "no in-page CTA came back with readable text — the label extraction is broken, " +
        "and a guard that reads no labels approves every label",
    ).toBe(true);
  });

  for (const a of anchors) {
    it(`${a.file} · ${a.href} does not promise WhatsApp`, () => {
      expect(
        a.text.includes(PROMISE),
        `${a.file} renders <a href="${a.href}"> labelled "${a.text}". A fragment href ` +
          `scrolls this page; it cannot open WhatsApp, so the "${PROMISE}" in that label ` +
          `is a promise the control does not keep. Either drop the word — the other ` +
          `${a.href} CTAs read plain "בדיקת התאמה" — or point the anchor at ` +
          `buildWhatsAppUrl(...) so the label becomes true.`,
      ).toBe(false);
    });
  }
});

// The launch strip used to live in this file's blind spot — a <button> whose
// handler scrolled to #sim while a sibling <p> promised "בדיקת התאמה בוואטסאפ".
// A gate was added for it on 2026-09-08; on 2026-09-09 the owner deleted the
// strip entirely and components/LaunchOfferStrip.tsx with it, so the gate is
// gone too rather than left reading a file that is not there. The defect it
// guarded cannot recur in a component that no longer exists, and the scan above
// still covers every <a href="#…"> on the site.

// ── one voice, and specifically ONE GRAMMATICAL PERSON ────────────────────────
//
// THE DEFECT THIS CLOSES (audit, 2026-09-09). components/seo/SeoCta.tsx rendered
// "בנה הצעת תשלום תוך דקה" — masculine singular — two lines above "דברו איתנו
// בוואטסאפ", plural, in the SAME CTA pair. It shipped on all four keyword landing
// pages, which are the site's only organic entry points.
//
// The site standardised on the plural imperative (בנו · צפו · גררו · דברו), and
// app/layout.tsx records the meta description being corrected to it on 2026-09-01
// with the reason written out. The four landing pages were not re-read that day, so
// the one remaining singular sat on exactly the pages a stranger arrives on.
//
// It is a real defect and not a stylistic quibble: the plural is also how Hebrew
// addresses someone without assuming their gender, and this site sells mobility
// scooters — a large part of its audience is women, and part of it is buying on
// behalf of a parent. A masculine-singular imperative addresses none of them.
//
// The word list is short and literal on purpose. A general "no singular imperative"
// scan cannot be written safely in Hebrew: מבנה, נבנה and גרור-as-an-instruction are
// all legitimate and all match a naive pattern. Add a word here when a real one is
// found, not speculatively.
describe("visitor-facing copy addresses the visitor in the plural", () => {
  // THE LIST IS SHORT BECAUSE HEBREW IS UNPOINTED, and two words earned their way
  // off it while this guard was being written:
  //   "מלא"  fired on "מסמך מלא" (lib/eligibility.ts) — an adjective, "a complete
  //          document", not "fill in".
  //   "לחץ"  fired on "בלי לחץ ובלי הפתעות" (components/DealBuzz.tsx) — a noun,
  //          "without pressure", not "click".
  // Same letters, different part of speech, and nothing in an unpointed string tells
  // them apart. Only add a word whose singular-imperative reading is its ONLY
  // reading — a guard that cries wolf gets suppressed, and then it guards nothing.
  //   "בחר"  was MISSING, and the gate shipped green while
  //          components/Configurator.tsx rendered "בחר והרץ סימולציה" on all three
  //          model cards — under an h2 that already reads "בחרו את המיה פור שלך".
  //          A guard is only as good as its list, and the list is the part that has
  //          to be revisited when a finding lands. Verified before adding: "בחר"
  //          with Hebrew lookarounds matches exactly ONE place in the whole tree,
  //          that button. The noun is בחירה and the plural is בחרו, so neither
  //          collides.
  const SINGULAR = ["בנה", "צפה", "בדוק", "גלה", "הצטרף", "בחר", "הרץ"];
  // Hebrew has no word boundary \b can see (the repo already paid for that once:
  // commit bdb91d2). Anchor on "not preceded/followed by a Hebrew letter" instead.
  const RE = new RegExp(`(?<![א-ת])(${SINGULAR.join("|")})(?![א-ת])`, "g");

  const files = [
    ...walk("components"),
    "lib/wa-cta.ts",
    "lib/content.ts",
    "lib/home-faq.ts",
    "lib/eligibility.ts",
    "lib/seo-pages.ts",
  ].filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));

  it("the scan is alive", () => {
    expect(files.length, "no source files found to scan").toBeGreaterThan(20);
    expect(RE.test("בנה הצעה"), "the pattern matches nothing — it is broken").toBe(true);
    RE.lastIndex = 0;
    expect(RE.test("מבנה העמוד"), "the pattern matches מבנה — the lookaround is broken").toBe(false);
    RE.lastIndex = 0;
    expect(RE.test("נבנה עליו"), "the pattern matches נבנה — the lookaround is broken").toBe(false);
    RE.lastIndex = 0;
  });

  for (const file of files) {
    it(`${file} uses no masculine-singular imperative`, () => {
      // Comments are exempt: the notes above and elsewhere must be able to quote the
      // word that was removed, or the reason for the removal is lost.
      const src = readFileSync(file, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .split("\n")
        .filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("*"))
        .join("\n");
      const hits = [...src.matchAll(RE)].map((m) => m[1]);
      expect(
        [...new Set(hits)],
        `${file} addresses the visitor in the masculine singular. The site standard ` +
          `is the plural imperative (בנו · צפו · דברו) — it is consistent, and it is ` +
          `how Hebrew addresses a reader without assuming their gender.`,
      ).toEqual([]);
    });
  }
});

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}
