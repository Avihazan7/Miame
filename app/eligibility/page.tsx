import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingWa from "@/components/FloatingWa";
import Tribute from "@/components/Tribute";
import LegalStatus from "@/components/LegalStatus";
import WaCta from "@/components/WaCta";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import { OG_CHROME } from "@/lib/seo/og";
import {
  ELIGIBILITY_FAQ,
  ELIGIBILITY_LEDE,
  ELIGIBILITY_SECTIONS,
  eligibilityFaqJsonLd,
} from "@/lib/eligibility";

const SITE_URL = "https://www.miame.co.il";

// The defence-forces eligibility route. See lib/eligibility.ts for the content and
// for the rule the copy is written under (it never claims an entitlement only the
// department can grant).
//
// WHAT CHANGED 2026-09-09. This page used to be <Tribute /> + <LegalStatus /> and
// nothing else — two blocks that already render on the homepage — under an
// `sr-only` H1. Three things were wrong with that at once, and they compounded:
//
//   1. THIN/DUPLICATE. 31 of 33 content segments were verbatim identical to the
//      homepage. Google has one canonical for a set of duplicates and it will not
//      be the page with one inbound link.
//   2. THE TERMS WERE ABSENT. title "זכאות כוחות הביטחון", H1 "זכאות כוחות
//      הביטחון · MiaMe", description, OG — none contained קלנועית, מיה פור, ניידות
//      or אגף שיקום. The page targeting the owner's priority query named none of it.
//   3. NO FAQ. The most question-shaped subject on the site was the only content
//      page with no question on it, so there was nothing for an answer engine to
//      quote and nothing for a rich result to render.
//
// The H1 is VISIBLE now. `sr-only` was defensible when the page was two reused
// blocks with no heading of its own to sit above; it is not defensible on a page
// whose whole purpose is to be the destination for one query. A visitor who lands
// here from that query must see, in the first line, that they are in the right place.
//
// AND ONE DELETION, DELIBERATE. The old description promised "נפגעי פעולות איבה".
// That phrase appeared nowhere else in the tree and nowhere on the page — a snippet
// promising an audience the page never addressed. It is also the one audience label
// here that does not obviously belong to משרד הביטחון: this page is about אגף
// השיקום and אגף משפחות והנצחה, and hostile-action casualties are handled
// elsewhere. Naming an authority wrongly on a page whose entire value is telling
// people WHICH authority to approach is the worst place on the site to guess, so
// the phrase is removed rather than expanded. Restoring it is an owner decision
// that needs the correct authority named with it.
export const metadata: Metadata = {
  title: "קלנועית במימון משרד הביטחון · זכאות אגף השיקום",
  description:
    "מיה פור, קלנועית חשמלית על 4 גלגלים, לזכאי ניידות של משרד הביטחון: אגף השיקום לנכי צה\"ל וכוחות הביטחון, ואגף משפחות והנצחה לבני משפחות שכולות. הזכאות והיקף המימון נקבעים על ידי משרד הביטחון בלבד.",
  alternates: { canonical: "/eligibility" },
  openGraph: {
    // OG_CHROME, not OG_BASE: this route has its OWN card at
    // app/eligibility/opengraph-image.tsx, which Next builds and serves at
    // /eligibility/opengraph-image. An explicit `images` in metadata BEATS that
    // file convention, so spreading the generic site card here meant the dedicated
    // one was generated, deployed, reachable at 200 — and referenced by nothing.
    // Omitting `images` lets the file convention win, which is what it is for.
    ...OG_CHROME,
    title: "קלנועית במימון משרד הביטחון · מיה פור לזכאי אגף השיקום",
    description:
      "שני מסלולי הניידות של משרד הביטחון, מה נדרש לפני הרכישה, ומה MiaMe כן ולא עושה בדרך. בכפוף לאישור האגף.",
    url: "/eligibility",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function EligibilityPage() {
  return (
    <>
      <BreadcrumbJsonLd name="קלנועית במימון משרד הביטחון" path="/eligibility" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: eligibilityFaqJsonLd(SITE_URL) }}
      />
      <Header />
      <main id="main">
        <div className="wrap" style={{ paddingTop: 28 }}>
          {/* The visible breadcrumb the JSON-LD above describes. They were out of
              step: the graph declared a two-level trail this page never drew. */}
          <nav className="seo-crumbs" aria-label="ניווט">
            <Link href="/">בית</Link>
            <span aria-hidden="true">›</span>
            <span>קלנועית במימון משרד הביטחון</span>
          </nav>
          <h1 className="sec-title" style={{ textAlign: "start", maxWidth: 820 }}>
            קלנועית במימון משרד הביטחון · ניידות לזכאי אגף השיקום
          </h1>
          <p className="seo-lede" style={{ maxWidth: 760 }}>
            {ELIGIBILITY_LEDE}
          </p>
        </div>

        {/* The two eligibility cards, the worksheet and the legally reviewed
            disclaimer. Unchanged, and still the single home of the frozen figures. */}
        <Tribute priority />

        <section className="block" aria-label="המסלולים והתהליך">
          <div className="wrap">
            <article className="seo-body">
              {ELIGIBILITY_SECTIONS.map((sec) => (
                <section key={sec.h}>
                  <h2>{sec.h}</h2>
                  {sec.body.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </section>
              ))}
            </article>
          </div>
        </section>

        <LegalStatus />

        <section className="block" aria-label="שאלות ותשובות על הזכאות">
          <div className="wrap">
            <div className="seo-faq">
              <h2>שאלות נפוצות · זכאות משרד הביטחון</h2>
              {ELIGIBILITY_FAQ.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
            <div className="sec-wa-out" style={{ marginTop: 28 }}>
              <WaCta cta="eligibility" variant="primary" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <FloatingWa />
    </>
  );
}
