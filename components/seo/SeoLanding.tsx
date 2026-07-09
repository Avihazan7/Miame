import Link from "next/link";
import Image from "next/image";
import type { SeoPage } from "@/lib/seo-pages";
import { SEO_CTA_NOTE } from "@/lib/seo-pages";
import { MODELS } from "@/lib/models";
import { buildProductJsonLd } from "@/lib/seo/product-jsonld";
import Product360Stage from "@/components/Product360Stage";
import SeoCta from "./SeoCta";

const SITE_URL = "https://www.miame.co.il";

// The "from" price is the cheapest live model — single source of truth (lib/models.ts),
// so the Offer price can never drift from the catalogue.
const FROM_PRICE = Math.min(...MODELS.map((m) => m.price));

// Product + FAQPage + BreadcrumbList structured data, derived from the same content
// model that renders the page (single source of truth — the schema can never drift
// from the visible copy). Product is grounded: single Offer, no ratings/reviews.
function jsonLd(page: SeoPage) {
  const url = `${SITE_URL}/${page.slug}`;
  const image = page.hero.image.startsWith("http") ? page.hero.image : SITE_URL + page.hero.image;
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildProductJsonLd({
        id: url,
        name: page.h1,
        description: page.description,
        image: [image],
        price: FROM_PRICE,
        currency: "ILS",
        availability: "https://schema.org/InStock",
        url,
        brand: "MiaMe",
      }),
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: page.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a }
        }))
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "בית", item: SITE_URL + "/" },
          { "@type": "ListItem", position: 2, name: page.breadcrumbName, item: url }
        ]
      }
    ]
  };
}

// Renders a full SEO landing page from its content model: hero, body sections,
// spec table, FAQ (native <details>, no JS), related internal links and CTAs.
// Presentational + server-rendered; the only client island is <SeoCta>.
export default function SeoLanding({ page }: { page: SeoPage }) {
  return (
    <main className="seo">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(page)) }}
      />
      <div className="wrap">
        <nav className="seo-crumbs" aria-label="ניווט">
          <Link href="/">בית</Link>
          <span aria-hidden="true">›</span>
          <span>{page.breadcrumbName}</span>
        </nav>

        <header className="seo-hero">
          <div className="seo-hero-copy">
            <div className="sec-kicker">{page.kicker}</div>
            <h1>{page.h1}</h1>
            <p className="seo-lede">{page.lede}</p>
            <SeoCta topic={page.breadcrumbName} />
          </div>
          <div className="seo-hero-media">
            <Image
              src={page.hero.image}
              alt={page.hero.alt}
              width={720}
              height={540}
              className="seo-hero-img"
              priority
            />
          </div>
        </header>

        {page.specs && (
          <section className="seo-specs" aria-label="מפרט">
            {page.specs.map((s) => (
              <div className="seo-spec" key={s.k}>
                <span className="seo-spec-k">{s.k}</span>
                <span className="seo-spec-v">{s.v}</span>
              </div>
            ))}
          </section>
        )}

        <Product360Stage vehicleId={page.slug} poster={page.hero.image} alt={page.hero.alt} glb={page.glb} />

        <article className="seo-body">
          {page.sections.map((sec) => (
            <section key={sec.h}>
              <h2>{sec.h}</h2>
              {sec.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </section>
          ))}
        </article>

        <section className="seo-faq" aria-label="שאלות ותשובות">
          <h2>שאלות נפוצות</h2>
          {page.faq.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>

        <section className="seo-related" aria-label="מידע נוסף">
          <h2>מידע נוסף</h2>
          <ul>
            {page.related.map((r) => (
              <li key={r.href}>
                <Link href={r.href}>{r.label}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="seo-final">
          <h2>מוכנים להתקדם?</h2>
          <p>בנו הצעת תשלום מותאמת תוך דקה, או דברו איתנו ישירות בוואטסאפ.</p>
          <SeoCta topic={page.breadcrumbName} />
          <p className="seo-note">{SEO_CTA_NOTE}</p>
        </section>
      </div>
    </main>
  );
}
