// test/skipLinkTarget.test.ts — the skip-link contract.
//
// FOUND BY DRIVING THE REAL SITE, NOT BY READING IT (2026-08-31). The production
// build was served locally and every route opened in a real mobile Chromium. On
// SEVEN of thirteen pages the very first focusable element — `<a href="#main">`,
// rendered by app/layout.tsx on EVERY page — pointed at an id that did not exist:
//
//     /mia-four  /klnoit-4-galgalim  /klnoit-mitkapelet  /klnoit-shetach
//     /legal/terms  /legal/privacy  /legal/accessibility
//
// That is a WCAG 2.4.1 (Bypass Blocks) failure, and app/legal/accessibility/page.tsx
// — itself one of the seven — publicly commits the site to ת"י 5568 / WCAG 2.1 AA
// and to full keyboard navigation. A published promise the code did not keep.
//
// 199 unit tests passed the whole time. None of them could see it: the link lives in
// one file and its target in twenty others, so no single file is wrong on its own.
// This test closes that gap statically, in milliseconds, without a browser.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Comments explain the rule, and this file's own fix comment contains the literal
 *  `id="main"`. Matching raw source would find THAT and pass while the attribute is
 *  gone — which is exactly how the first version of this test scored a false green on
 *  the four SEO pages. Only what the component actually RENDERS is in scope. */
const code = (src: string) =>
  src
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, " ") // JSX {/* ... */}
    .replace(/\/\*[\s\S]*?\*\//g, " ") // /* ... */
    .replace(/^\s*\/\/.*$/gm, " "); // // ...

const layout = code(readFileSync("app/layout.tsx", "utf8"));

/** Every page.tsx under app/, with its route-group segments stripped. */
function pages(dir = "app", acc: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) pages(p, acc);
    else if (e.name === "page.tsx") acc.push(p);
  }
  return acc;
}

/** Follow a page to the component that actually renders its <main>. */
function renderedBy(file: string): string {
  const src = code(readFileSync(file, "utf8"));
  if (/<main[^>]/.test(src)) return src;
  // The page delegates — resolve the single component it returns.
  const delegate = src.match(/return\s*<([A-Z][A-Za-z0-9]*)\s/);
  if (!delegate) return src;
  const imp = src.match(new RegExp(`import\\s+${delegate[1]}\\s+from\\s+["']([^"']+)["']`));
  if (!imp) return src;
  const rel = imp[1].replace(/^@\//, "");
  for (const ext of [".tsx", ".ts"]) {
    try {
      return code(readFileSync(rel + ext, "utf8"));
    } catch {
      /* try the next extension */
    }
  }
  return src;
}

describe("the skip-link lands somewhere on every page", () => {
  const target = layout.match(/className="skip-link"[^>]*|href="(#[^"]+)"[^>]*className="skip-link"/);

  it("the layout still ships a skip-link, and it targets #main", () => {
    // If this ever changes, the rest of the file is asserting about the wrong id.
    expect(layout).toContain('className="skip-link"');
    expect(layout).toMatch(/href="#main"[^>]*className="skip-link"/);
    expect(target).toBeTruthy();
  });

  const files = pages();

  it("covers every page in app/", () => {
    // A guard that silently stops finding pages is worse than no guard.
    // Baseline 13 → 12 on 2026-09-02: /partners and /rent-eilat were REMOVED by
    // owner decision (MiaMe sells MIA FOUR and nothing else) and now answer 410.
    // This number is a vacuity guard — it exists to catch a walk that stopped
    // finding files, not to pin a count — so it tracks reality rather than
    // holding a number the site no longer has.
    expect(files.length).toBeGreaterThanOrEqual(12);
  });

  for (const f of files) {
    it(`${f} provides id="main"`, () => {
      const src = renderedBy(f);
      expect(
        /id="main"/.test(src),
        `${f} renders under the root layout, so it shows a "דילוג לתוכן הראשי" link — ` +
          `but nothing it renders declares id="main", so that link goes nowhere. ` +
          `Add id="main" to its <main> element (or to the component that renders it).`,
      ).toBe(true);
    });
  }
});
