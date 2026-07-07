// Go-live guards — SEO indexability, sitemap/robots integrity, and a 416 range
// regression guard. All read-only: metadata objects, static content data, and
// pure route handlers (no network, no DB writes).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { metadata as thankYouMeta } from "@/app/thank-you/page";
import { metadata as notFoundMeta } from "@/app/not-found";
import { SEO_PAGES } from "@/lib/seo-pages";
import { GET as healthGet } from "@/app/api/health/route";
import { GET as leadGet } from "@/app/api/lead/route";
import { GET as dealGet } from "@/app/api/deal/route";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

describe("system pages stay noindex", () => {
  it("thank-you is noindex/nofollow", () => {
    expect((thankYouMeta.robots as { index?: boolean }).index).toBe(false);
    expect((thankYouMeta.robots as { follow?: boolean }).follow).toBe(false);
  });

  it("404 is noindex", () => {
    expect((notFoundMeta.robots as { index?: boolean }).index).toBe(false);
  });
});

describe("SEO landing pages are real, indexable, non-thin", () => {
  it("has the expected keyword pages with unique slugs", () => {
    const slugs = SEO_PAGES.map((p) => p.slug);
    expect(slugs).toEqual(
      expect.arrayContaining(["mia-four", "klnoit-4-galgalim", "klnoit-mitkapelet", "klnoit-shetach"])
    );
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every page carries substantive content + valid internal links (no thin/cannibalising pages)", () => {
    for (const p of SEO_PAGES) {
      expect(p.title.length, `${p.slug} title`).toBeGreaterThan(15);
      expect(p.description.length, `${p.slug} description`).toBeGreaterThan(60);
      expect(p.lede.length, `${p.slug} lede`).toBeGreaterThan(60);
      expect(p.faq.length, `${p.slug} faq`).toBeGreaterThanOrEqual(3);
      expect(p.sections.length, `${p.slug} sections`).toBeGreaterThanOrEqual(3);
      const bodyLen = p.sections.flatMap((s) => s.body).join(" ").length;
      expect(bodyLen, `${p.slug} body length`).toBeGreaterThan(600);
      expect(p.related.length, `${p.slug} related`).toBeGreaterThanOrEqual(1);
      for (const r of p.related) expect(r.href.startsWith("/"), `${p.slug} rel ${r.href}`).toBe(true);
    }
  });
});

describe("sitemap + robots are consistent", () => {
  const sitemap = read("public/sitemap.xml");
  const robots = read("public/robots.txt");

  it("lists the home, SEO and legal pages", () => {
    for (const path of [
      "/",
      "/mia-four",
      "/klnoit-4-galgalim",
      "/klnoit-mitkapelet",
      "/klnoit-shetach",
      "/legal/terms",
      "/legal/privacy",
      "/legal/accessibility",
    ]) {
      expect(sitemap, `sitemap missing ${path}`).toContain(`https://www.miame.co.il${path}`);
    }
  });

  it("never lists system/admin/thank-you/api paths", () => {
    for (const bad of ["/thank-you", "/api/", "/api/lead", "/api/embed"]) {
      expect(sitemap, `sitemap leaks ${bad}`).not.toContain(`miame.co.il${bad}`);
    }
  });

  it("robots allows crawling and points at the sitemap", () => {
    expect(robots).toMatch(/Allow:\s*\//i);
    expect(robots).toMatch(/Sitemap:\s*https:\/\/www\.miame\.co\.il\/sitemap\.xml/i);
  });
});

// 416 (Range Not Satisfiable) is a static/CDN-layer artifact — it can only arise
// from a byte-range request. The dynamic API surface returns JSON and must never
// become a range surface (no Accept-Ranges), so an accidental range-serving API
// route — the one way to newly introduce APP-level 416s — is caught here.
describe("416 regression guard · API routes are not byte-range surfaces", () => {
  const cases: [string, () => Response | Promise<Response>][] = [
    ["/api/health", healthGet],
    ["/api/lead", leadGet],
    ["/api/deal", dealGet],
  ];

  it("every JSON API GET returns application/json and does not advertise Accept-Ranges", async () => {
    for (const [name, handler] of cases) {
      const res = await handler();
      expect(res.headers.get("content-type"), `${name} content-type`).toContain("application/json");
      expect(res.headers.get("accept-ranges"), `${name} accept-ranges`).toBeNull();
      expect(res.headers.get("content-range"), `${name} content-range`).toBeNull();
    }
  });
});
