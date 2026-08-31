/**
 * BreadcrumbList for the hand-built routes.
 *
 * /klnoit-* get their breadcrumb from SeoLanding, which builds one from the page
 * content model. /eligibility and /partners are written by hand and had none — so
 * a search or answer engine reaching them saw a page with no place in the site's
 * hierarchy, and Google had nothing to render as a breadcrumb in the result.
 *
 * Emits ONLY the crumb. Organization, WebSite, Product and FAQPage already come
 * from app/layout.tsx on every route; duplicating any of them here would put two
 * conflicting descriptions of the same entity on one page.
 */
const SITE_URL = "https://www.miame.co.il";

export default function BreadcrumbJsonLd({ name, path }: { name: string; path: string }) {
  const url = `${SITE_URL}${path}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "בית", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name, item: url },
    ],
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );
}
