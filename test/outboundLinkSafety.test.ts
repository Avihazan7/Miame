// test/outboundLinkSafety.test.ts — every link that LEAVES the site behaves the same way.
//
// FOUND BY CRAWLING THE BUILT SITE (2026-09-09). Every route was served from a real
// production build and every `<a href>` on every page was collected and classified.
// Sixteen outbound links carried `target="_blank" rel="noopener"`. Exactly one did not:
// the WhatsApp link to the accessibility coordinator in app/legal/accessibility/page.tsx.
//
// That one is the worst possible place for the exception. The paragraph directly below
// it asks the visitor to bring "פירוט של הבעיה, הדף שבו נתקלת בה וסוג הטכנולוגיה
// המסייעת" — so the page navigated away exactly when the reader still needed to read it,
// and a visitor who came to report a barrier hit one on the way out. Same-tab is also the
// only variant where `rel` is absent entirely, so the inconsistency and the missing
// hardening arrived together.
//
// This is a shape rule, not a taste rule, which is why it is mechanical: an outbound
// anchor either opens in a new tab with `noopener`, or the tree is wrong. `noopener`
// specifically — `noreferrer` is a per-link editorial choice (the WA sales CTAs carry it,
// the footer's leasing.co.il link deliberately does not) and this gate does not litigate it.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Comments are prose, not markup. This file itself writes `target="_blank"` in the
 *  paragraphs above; matching raw source would count those and score a false green. */
const code = (src: string) =>
  src
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");

function tsxFiles(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) tsxFiles(p, acc);
    else if (e.name.endsWith(".tsx")) acc.push(p);
  }
  return acc;
}

const SOURCES = [...tsxFiles("app"), ...tsxFiles("components")];

/** An opening <a ...> tag, captured whole so its attributes can be read together.
 *  Non-greedy up to the first `>` that is not inside a brace expression is good enough
 *  here because no anchor in this tree nests a `>` in an attribute value. */
const ANCHOR = /<a\s[^>]*>/g;

/** Leaves the origin: an absolute http(s) URL literal, or one of the three helpers
 *  the crawl proved return one — `buildWhatsAppUrl(...)`, `waHref(...)` and the `waUrl`
 *  local both of them feed. A helper is exactly where an outbound link hides from a
 *  naive `https://` grep, which is why they are named rather than inferred.
 *
 *  `tel:` is deliberately NOT outbound. A phone link hands off to the dialer and never
 *  navigates; forcing `_blank` on it would leave a blank tab behind on desktop. The
 *  three `tel:` anchors on the legal pages are correct as they stand. */
const OUTBOUND = /href=(?:"https?:\/\/|\{(?:buildWhatsAppUrl\(|waHref\(|waUrl\}))/;

describe("outbound links", () => {
  const anchors: { file: string; tag: string }[] = [];
  for (const file of SOURCES) {
    for (const tag of code(readFileSync(file, "utf8")).match(ANCHOR) ?? []) {
      if (OUTBOUND.test(tag)) anchors.push({ file, tag });
    }
  }

  it("the crawl found outbound anchors, so this gate has something to guard", () => {
    // Without this, a refactor that renames a helper turns the whole suite into a
    // vacuous pass — zero anchors, zero failures, zero protection. Eight is the count
    // measured on 2026-09-09; it is a floor, so adding an outbound link is free and
    // silently losing one is not.
    expect(anchors.length).toBeGreaterThanOrEqual(8);
  });

  it("every outbound link opens in a new tab", () => {
    const offenders = anchors
      .filter(({ tag }) => !/target="_blank"/.test(tag))
      .map(({ file, tag }) => `${file}: ${tag.replace(/\s+/g, " ").slice(0, 120)}`);
    expect(offenders).toEqual([]);
  });

  it("every outbound link carries rel=noopener", () => {
    const offenders = anchors
      .filter(({ tag }) => !/rel="[^"]*\bnoopener\b[^"]*"/.test(tag))
      .map(({ file, tag }) => `${file}: ${tag.replace(/\s+/g, " ").slice(0, 120)}`);
    expect(offenders).toEqual([]);
  });
});
