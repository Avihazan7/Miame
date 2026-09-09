import type { MetadataRoute } from "next";
import { SEO_PAGES } from "@/lib/seo-pages";

// app/sitemap.ts — the sitemap is GENERATED, not typed.
//
// WHAT THIS REPLACES. `public/sitemap.xml` was a hand-maintained file, and nothing
// in the repo bound it to the route table in either direction. The two tests that
// touched it read it as text: test/goLive.test.ts asserted a hardcoded list of eight
// paths — which never contained /eligibility, even though the file did list it — and
// test/routeReachability.test.ts only checked one direction (nothing in the sitemap
// may be noindex). So both failure modes were invisible:
//   (a) delete a page  → the sitemap keeps submitting a URL that now 404s;
//   (b) add a page     → it is indexable, linked, and never submitted.
// (a) is exactly what the repo already paid for with /partners, inverted.
//
// Deriving the list from lib/seo-pages.ts means a new landing page enters the
// sitemap with zero extra edits, and test/sitemapContract.test.ts now asserts
// SET EQUALITY against the routes Next actually builds — so neither direction can
// drift again.
//
// WHY NO lastmod. Google reads lastmod and ignores changefreq/priority, so an
// accurate lastmod would be the valuable field. We do not have one: the content
// lives in TypeScript modules with no timestamp, and stamping the build date on
// every URL would tell Google that nine pages changed every time one of them did —
// a signal it learns to distrust and then ignores for the whole domain. A
// fabricated timestamp is worse than an absent one. changefreq/priority are kept
// because they cost nothing and other crawlers still read them.
const SITE_URL = "https://www.miame.co.il";

/** Indexable routes that are written by hand (everything that is not a SEO_PAGES entry). */
const STATIC_ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/eligibility", changeFrequency: "monthly", priority: 0.8 },
  { path: "/legal/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/legal/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/legal/accessibility", changeFrequency: "yearly", priority: 0.3 },
];

/** The one place the sitemap's paths are decided. Exported so tests can diff it
 *  against the built route table instead of parsing XML. */
export function sitemapPaths(): string[] {
  return [
    ...STATIC_ROUTES.map((r) => r.path),
    ...SEO_PAGES.map((p) => `/${p.slug}`),
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...STATIC_ROUTES.map((r) => ({
      url: SITE_URL + r.path,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...SEO_PAGES.map((p) => ({
      url: `${SITE_URL}/${p.slug}`,
      changeFrequency: "monthly" as const,
      // /mia-four is the product hub the other three funnel into.
      priority: p.slug === "mia-four" ? 0.9 : 0.8,
    })),
  ];
}
