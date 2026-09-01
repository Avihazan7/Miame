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
