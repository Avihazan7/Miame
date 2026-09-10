// test/siteOriginSingleSource.test.ts — the canonical origin is written once.
//
// FOUND BY COUNTING (2026-09-10). `const SITE_URL = "https://www.miame.co.il"` was
// declared independently in SIX modules — app/layout.tsx, app/sitemap.ts,
// app/eligibility/page.tsx, components/seo/SeoLanding.tsx,
// components/seo/BreadcrumbJsonLd.tsx and lib/home-faq.ts — every one of which
// builds URLs that a search engine reads as identity claims.
//
// Six copies had already produced a live inconsistency. Every surface declared the
// homepage as `https://www.miame.co.il`; app/sitemap.ts submitted it to Google as
// `https://www.miame.co.il/`, because it built URLs by concatenation and the
// homepage's path is "/". RFC 3986 §6.2.3 makes those equivalent so nothing 404'd,
// which is exactly why it survived: the defect is invisible to every check that
// resolves the URL, and visible only to one that compares the two spellings.
//
// The fix is lib/site.ts + canonicalUrl(). This test is what makes it stay fixed —
// otherwise the next person needing the origin writes the literal again, which is
// how there came to be six.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { SITE_URL, canonicalUrl } from "@/lib/site";
import { sitemapPaths } from "@/app/sitemap";

const ORIGIN = "https://www.miame.co.il";

/** Comments may name the literal — this file's own prose does, and app/sitemap.ts's
 *  explanation of the bug must. Only declarative code is in scope. */
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

/** Two files answer a DIFFERENT question — "is this origin trusted?" rather than
 *  "what is our canonical origin?" — and must keep their own literal:
 *
 *  components/vehicle-media/selfHostedUrl.ts  an allowlist of origins we self-host
 *      from. A security predicate; its own comment explains that the trailing slash
 *      is load-bearing there, which is the opposite of what canonicalUrl() does.
 *  lib/apiGuard.ts  the DEFAULT of a CORS allowlist env var — a comma-joined string
 *      carrying the apex and two leasing.co.il hosts, not a link builder.
 *
 *  Collapsing either into lib/site.ts would couple a security boundary to a branding
 *  constant. The exemption is recorded here so it reads as a decision, not an
 *  oversight — and it is a NAMED list, so a third file cannot join it silently. */
const EXEMPT = new Set(["components/vehicle-media/selfHostedUrl.ts", "lib/apiGuard.ts"]);

describe("the canonical origin has exactly one home", () => {
  const offenders = [...sources("app"), ...sources("lib"), ...sources("components")]
    .filter((f) => f !== "lib/site.ts" && !EXEMPT.has(f))
    .filter((f) => code(readFileSync(f, "utf8")).includes(ORIGIN));

  it("no module outside lib/site.ts writes the origin literal", () => {
    expect(offenders).toEqual([]);
  });

  it("the exempt files still exist and still contain the literal", () => {
    // An exemption for a file that no longer needs it is dead permission: it would
    // silently re-open the hole if that path were ever reused.
    for (const f of EXEMPT) {
      expect(readFileSync(f, "utf8"), `${f} no longer needs its exemption`).toContain(ORIGIN);
    }
  });
});

describe("canonicalUrl spells the homepage the way the canonical tag does", () => {
  it('maps "/" to the bare origin, not origin + "/"', () => {
    // This one case is the entire reason the helper exists.
    expect(canonicalUrl("/")).toBe(SITE_URL);
    expect(canonicalUrl("/")).not.toBe(`${SITE_URL}/`);
  });

  it("maps a real route to origin + path", () => {
    expect(canonicalUrl("/eligibility")).toBe(`${SITE_URL}/eligibility`);
    expect(canonicalUrl("/legal/terms")).toBe(`${SITE_URL}/legal/terms`);
  });

  it("tolerates a path with no leading slash rather than producing a joined word", () => {
    expect(canonicalUrl("mia-four")).toBe(`${SITE_URL}/mia-four`);
  });

  it("no sitemap URL carries a trailing slash", () => {
    // The measured defect, stated as the invariant it violated. Every path in the
    // sitemap goes through canonicalUrl or an explicit `/${slug}`, so a trailing
    // slash anywhere means someone concatenated again.
    const urls = sitemapPaths().map((p) => canonicalUrl(p));
    expect(urls.length).toBeGreaterThanOrEqual(9);
    expect(urls.filter((u) => u.endsWith("/"))).toEqual([]);
  });
});
