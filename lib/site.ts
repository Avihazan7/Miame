// lib/site.ts — the origin, in one place.
//
// FOUND BY COUNTING (2026-09-10). `const SITE_URL = "https://www.miame.co.il"` was
// declared independently in SIX modules:
//
//     app/layout.tsx · app/sitemap.ts · app/eligibility/page.tsx
//     components/seo/SeoLanding.tsx · components/seo/BreadcrumbJsonLd.tsx
//     lib/home-faq.ts
//
// Six copies of a constant is not a style problem, and this one had already produced
// a live inconsistency: every surface on the site declared the homepage as
// `https://www.miame.co.il`, while app/sitemap.ts submitted it to Google as
// `https://www.miame.co.il/`. RFC 3986 §6.2.3 makes those equivalent, so nothing
// broke — but a sitemap's job is to submit the canonical form, and Search Console
// reports the mismatch rather than normalising it away.
//
// The constant now lives here and is imported. `canonicalUrl()` is what makes the
// drift impossible rather than merely fixed: it is the only way a path becomes an
// absolute URL, and it normalises "/" to the bare origin, which is the form
// `alternates: { canonical: "/" }` resolves to against `metadataBase`.
//
// DELIBERATELY NOT MIGRATED — two other files contain this literal and must keep it:
//   components/vehicle-media/selfHostedUrl.ts — an allowlist of origins we self-host
//     from. It is a security predicate, not a link builder, and its own comment
//     explains why the trailing slash is load-bearing there.
//   lib/apiGuard.ts — the DEFAULT value of a CORS allowlist env var, a comma-joined
//     multi-origin string that includes the apex and two leasing.co.il hosts.
// Both answer a different question ("is this origin trusted?") from this module
// ("what is our canonical origin?"). Collapsing them would couple a security
// boundary to a branding constant. test/siteOriginSingleSource.ts records the
// exemption by name so it is a decision, not an oversight.

/** The canonical origin. No trailing slash — this is the form Next resolves
 *  `metadataBase` + `canonical: "/"` to, and therefore the form every surface
 *  must agree with. */
export const SITE_URL = "https://www.miame.co.il";

/**
 * Absolute URL for an app route.
 *
 * `canonicalUrl("/")` is the bare origin, NOT `origin + "/"`. That single case is
 * the whole reason this helper exists: it is the one path where naive concatenation
 * produces a second spelling of the same page.
 */
export function canonicalUrl(path: string): string {
  if (!path || path === "/") return SITE_URL;
  return SITE_URL + (path.startsWith("/") ? path : `/${path}`);
}
