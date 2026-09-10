// test/sitemapContract.test.ts — the sitemap and the route table must agree, BOTH WAYS.
//
// THE DEFECT THIS CLOSES (audit, 2026-09-09). `public/sitemap.xml` was a
// hand-maintained file and nothing bound it to app/. The two tests that touched it
// could not see either failure mode:
//
//   test/goLive.test.ts asserted a HARDCODED list of eight paths, and /eligibility —
//   the Ministry-of-Defence funnel, and a page the file did in fact list — was not
//   among them. So the sitemap's coverage of that route was never actually tested.
//
//   test/routeReachability.test.ts ran the check in ONE direction only: nothing in
//   the sitemap may declare robots:{index:false}. A route that was indexable and
//   simply absent from the sitemap passed silently.
//
// Which left both directions open:
//   (a) delete a page → the sitemap keeps submitting a URL that now answers 404.
//       This is the /partners failure, inverted, and /partners cost this repo a
//       whole test file.
//   (b) add a page → it ships indexable, linked and never submitted to Google.
//
// The sitemap is now GENERATED (app/sitemap.ts) and this file is the contract:
// SET EQUALITY between what Next will build as an indexable page and what the
// sitemap submits. There is deliberately no exemption list — a "known exception"
// list is where this defect would come back to live. The two honest ways to fix a
// failure here are to add the route to app/sitemap.ts, or to declare it
// robots:{index:false}.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import sitemap, { sitemapPaths } from "@/app/sitemap";

/** Every page.tsx under app/ as the URL path Next will serve it at. Route groups
 *  ("(seo)") are structural and contribute no path segment. */
function appRoutes(): { route: string; file: string }[] {
  const out: { route: string; file: string }[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) {
        // Route handlers and private folders never render a page.
        if (entry.name.startsWith("_") || entry.name === "api") continue;
        walk(p);
      } else if (entry.name === "page.tsx") {
        const route =
          "/" +
          dir
            .replace(/^app\/?/, "")
            .split("/")
            .filter((s) => s && !(s.startsWith("(") && s.endsWith(")")))
            .join("/");
        out.push({ route: route === "/" ? "/" : route.replace(/\/$/, ""), file: p });
      }
    }
  };
  walk("app");
  return out;
}

/** A route is indexable unless its own metadata says `index: false`. Matches the
 *  classification test/routeReachability.test.ts uses, deliberately — two gates
 *  disagreeing about what "published" means is worse than one gate. */
function isIndexable(file: string): boolean {
  const src = readFileSync(file, "utf8");
  return !/robots:\s*\{[^}]*index:\s*false/.test(src);
}

describe("app/sitemap.ts and the route table agree in both directions", () => {
  const routes = appRoutes();

  it("the route scan is alive (a blind guard is worse than none)", () => {
    // If the walk ever stops finding files, every assertion below passes vacuously.
    expect(routes.length, "no page.tsx found under app/").toBeGreaterThanOrEqual(12);
    expect(routes.map((r) => r.route)).toContain("/");
    expect(routes.map((r) => r.route)).toContain("/eligibility");
    expect(routes.map((r) => r.route)).toContain("/klnoit-shetach");
  });

  it("every indexable route is submitted", () => {
    const submitted = new Set(sitemapPaths());
    const missing = routes
      .filter((r) => isIndexable(r.file))
      .map((r) => r.route)
      .filter((r) => !submitted.has(r));
    expect(
      missing,
      "these routes are indexable but app/sitemap.ts does not submit them, so Google " +
        "is never told they exist. Add them to STATIC_ROUTES, or declare " +
        "robots:{index:false} if they are not for the public.",
    ).toEqual([]);
  });

  it("everything submitted is a route that exists and is indexable", () => {
    const built = new Map(routes.map((r) => [r.route, r.file]));
    const bogus = sitemapPaths().filter((p) => {
      const file = built.get(p);
      return !file || !isIndexable(file);
    });
    expect(
      bogus,
      "app/sitemap.ts submits these to Google, but they either do not exist as a " +
        "page (Google gets a 404) or declare robots:{index:false} (a contradiction " +
        "the site issues about itself).",
    ).toEqual([]);
  });

  it("submits absolute https URLs on the canonical www host, with no duplicates", () => {
    const entries = sitemap();
    expect(entries.length).toBe(sitemapPaths().length);
    for (const e of entries) {
      expect(e.url, `${e.url} is not on the canonical origin`).toMatch(
        /^https:\/\/www\.miame\.co\.il(\/|$)/,
      );
      // The ROOT is exempt and deliberately so: RFC 3986 normalises an empty path
      // to "/", so https://www.miame.co.il and https://www.miame.co.il/ are the
      // same URL, and the trailing form is what sitemaps conventionally carry.
      // Next emits the bare form in <link rel=canonical>; both are correct. Every
      // OTHER path must not carry one, because there the two forms are genuinely
      // different URLs and a mismatch with the canonical is a duplicate.
      if (e.url !== "https://www.miame.co.il/") {
        expect(e.url, `${e.url} has a trailing slash its canonical does not`).not.toMatch(/\/$/);
      }
    }
    expect(new Set(entries.map((e) => e.url)).size, "duplicate URL in the sitemap").toBe(
      entries.length,
    );
  });

  it("carries no fabricated lastmod", () => {
    // Deliberate: see the note in app/sitemap.ts. Stamping the build date on every
    // URL tells Google nine pages changed whenever one did, which is the signal it
    // learns to distrust. If a real per-page timestamp ever exists, this assertion
    // is the thing to delete — consciously.
    for (const e of sitemap()) expect(e.lastModified, `${e.url} carries a lastmod`).toBeUndefined();
  });
});
