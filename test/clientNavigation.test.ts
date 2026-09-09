// test/clientNavigation.test.ts — an internal route is reached by the router, not
// by reloading the document.
//
// THE DEFECT THIS CLOSES (measured 2026-09-09). In the app router a plain
// `<a href="/legal/privacy">` is not a slower <Link>; it is a different thing. The
// browser tears down the React tree, refetches the HTML document, re-parses every
// stylesheet and re-hydrates from zero. Everything this site keeps in memory dies
// with it — the consent decision the banner just recorded, the configurator's
// in-progress selections, the ambience tilt, the campaign UTM held for the WhatsApp
// handoff. <Link> keeps the client alive and prefetches the route on hover.
//
// WHY THIS IS A TEST AND NOT A LINT RULE. @next/next/no-html-link-for-pages exists
// and is enabled — and in an app-router project it can only ever catch links to "/".
// The bug is upstream and structural, in @next/eslint-plugin-next/dist/utils/url.js:
//
//     function parseUrlForAppDir(urlprefix, directory) {
//       ...
//       res.push(...parseUrlForPages(urlprefix + dirent.name + '/', dirPath))
//     }                  ^^^^^^^^^^^^^^^^^ recurses with PAGES semantics
//
// parseUrlForAppDir hands every subdirectory to parseUrlForPages, which strips only
// the file extension. So app/legal/privacy/page.tsx enters the rule's known-URL set
// as "/legal/privacy/page" — a URL nothing links to — and the real link to
// "/legal/privacy" matches nothing and passes. Only app/page.tsx, parsed at the top
// level with app semantics, resolves correctly to "/". Verified against
// @next/eslint-plugin-next 15.5.25: of 17 offending anchors in this repo the rule
// reported 7, and all 7 pointed at "/".
//
// So the linter covers the one route it can prove and this file covers the rest. If
// the upstream recursion is ever fixed the two overlap, which is harmless; deleting
// this file on that assumption is not.
//
// SCOPE, HONESTLY. This reads source text. It sees a literal `href="/…"` on an <a>
// and nothing else — not `href={someVar}` that happens to hold an internal path, and
// not a link built by a helper. Those are real gaps; they are also not how any link
// in this tree is currently written.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["app", "components"];

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...tsxFiles(p));
    else if (entry.name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

const FILES = ROOTS.flatMap(tsxFiles);

// An <a …> opening tag, however many attributes and lines it spans, whose href is a
// string literal beginning with a single "/" — i.e. an in-site path. A protocol-
// relative "//host" URL is off-site, so it is excluded here rather than reported.
const INTERNAL_ANCHOR = /<a\s[^>]*?href="(\/(?!\/)[^"]*)"/gs;

type Hit = { file: string; line: number; href: string };

function internalAnchors(): Hit[] {
  const hits: Hit[] = [];
  for (const file of FILES) {
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(INTERNAL_ANCHOR)) {
      hits.push({
        file,
        line: src.slice(0, m.index).split("\n").length,
        href: m[1],
      });
    }
  }
  return hits;
}

describe("internal navigation goes through the router", () => {
  it("no <a> element navigates to an in-site path", () => {
    const hits = internalAnchors();
    const report = hits.map((h) => `${h.file}:${h.line} → ${h.href}`);
    expect(report, "use <Link href> from next/link, not <a href>").toEqual([]);
  });

  // The gate above is only worth its runtime if it is actually looking at the files
  // where links live. A refactor that moves or renames a directory would otherwise
  // turn it into a test that scans nothing and passes for that reason.
  it("scans the directories that actually contain links", () => {
    expect(FILES.length).toBeGreaterThan(30);
    expect(FILES).toContain(join("components", "Header.tsx"));
    expect(FILES).toContain(join("components", "Footer.tsx"));
    expect(FILES).toContain(join("app", "legal", "privacy", "page.tsx"));
  });

  // The pattern has to survive the two shapes this tree actually writes: a one-line
  // anchor, and an anchor whose attributes are broken across lines.
  it("matches an internal <a> whether it is written on one line or many", () => {
    const oneLine = `<a href="/legal/terms">x</a>`;
    const manyLines = `<a\n  className="c"\n  href="/eligibility"\n>x</a>`;
    expect([...oneLine.matchAll(INTERNAL_ANCHOR)].map((m) => m[1])).toEqual(["/legal/terms"]);
    expect([...manyLines.matchAll(INTERNAL_ANCHOR)].map((m) => m[1])).toEqual(["/eligibility"]);
  });

  // And it has to leave alone every href that is NOT an in-site path, or the honest
  // fix for a failure becomes "hide the link from the test".
  it("ignores off-site, protocol, fragment and dynamic hrefs", () => {
    const benign = [
      `<a href="https://wa.me/x">x</a>`,
      `<a href="//cdn.example.com/a">x</a>`,
      `<a href="tel:0500000000">x</a>`,
      `<a href="mailto:a@b.c">x</a>`,
      `<a href="#main">x</a>`,
      `<a href={waUrl}>x</a>`,
    ].join("\n");
    expect([...benign.matchAll(INTERNAL_ANCHOR)]).toEqual([]);
  });
});
