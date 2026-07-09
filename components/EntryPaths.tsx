"use client";

import { CTA } from "@/lib/cta";
import { track } from "@/lib/analytics";

// Entry paths — give a first-time visitor a clear route within 3 seconds.
// Two shapes (Market-OS funnel hierarchy):
//   • "homepage" — B2C clarity: two dominant primary cards (buy · eligibility)
//     plus two reduced secondary links (rent · partner) to their dedicated pages.
//   • "full" — the complete four-card grid (used where all routes are equal).
// Links to existing sections and dedicated pages. The one behaviour: a best-effort
// EntryPathSelect event on click (public.events) — the funnel fork is the single
// highest-signal analytics question. Navigation is never blocked.

type Path = {
  href: string;
  icon: string;
  title: string;
  desc: string;
  cta: string;
  tone: string;
};

const BUY: Path = {
  href: "#sim",
  icon: "🛒",
  title: "רכישת MIA FOUR",
  desc: "בונים הצעת תשלום — עד 18 תשלומים ללא ריבית והצמדה.",
  cta: CTA.fit,
  tone: "buy",
};
const ELIGIBILITY: Path = {
  href: "/eligibility",
  icon: "🇮🇱",
  title: "זכאות כוחות הביטחון",
  desc: "נכי צה\"ל ומשפחות שכולות — עד 100% בכפוף לאישור.",
  cta: CTA.tribute,
  tone: "tribute",
};
const RENT: Path = {
  href: "/rent-eilat",
  icon: "♻️",
  title: "השכרה באילת",
  desc: "צי השכרה לפי שעה ב-Green Extreme · פארק הטרמינל.",
  cta: CTA.rental,
  tone: "rent",
};
const PARTNER: Path = {
  href: "/partners",
  icon: "🤝",
  title: "MiaMe Hub לשותפים",
  desc: "מפעילים צי השכרה רווחי — אתם הבעלים, אנחנו מביאים ביקוש.",
  cta: CTA.partner,
  tone: "partner",
};

const FULL: Path[] = [BUY, RENT, ELIGIBILITY, PARTNER];
const PRIMARY: Path[] = [BUY, ELIGIBILITY];
const SECONDARY: Path[] = [RENT, PARTNER];

function selectPath(p: Path) {
  void track("EntryPathSelect", { path: p.tone, href: p.href });
}

function Card({ p }: { p: Path }) {
  return (
    <a className={`entry-card entry-${p.tone}`} href={p.href} onClick={() => selectPath(p)}>
      <span className="entry-ic" aria-hidden="true">
        {p.icon}
      </span>
      <span className="entry-title">{p.title}</span>
      <span className="entry-desc">{p.desc}</span>
      <span className="entry-cta">{p.cta} ›</span>
    </a>
  );
}

function MiniCard({ p }: { p: Path }) {
  return (
    <a className={`entry-mini entry-${p.tone}`} href={p.href} onClick={() => selectPath(p)}>
      <span className="entry-mini-ic" aria-hidden="true">
        {p.icon}
      </span>
      <span className="entry-mini-body">
        <span className="entry-mini-title">{p.title}</span>
        <span className="entry-mini-cta">{p.cta} ›</span>
      </span>
    </a>
  );
}

export default function EntryPaths({ variant = "full" }: { variant?: "homepage" | "full" }) {
  if (variant === "homepage") {
    return (
      <section className="block entry-sec" id="start" aria-labelledby="entry-title">
        <div className="wrap">
          <div className="sec-head">
            <div className="sec-kicker">איך תרצו להתחיל?</div>
            <h2 className="sec-title" id="entry-title">
              רכישה או זכאות — נתחיל מכאן
            </h2>
            <p className="sec-desc">שני המסלולים המובילים. השכרה באילת ושותפות MiaMe Hub — במרחק קליק.</p>
          </div>

          <div className="entry-grid entry-grid-primary">
            {PRIMARY.map((p) => (
              <Card p={p} key={p.href} />
            ))}
          </div>

          <div className="entry-secondary" aria-label="מסלולים נוספים">
            {SECONDARY.map((p) => (
              <MiniCard p={p} key={p.href} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="block entry-sec" id="start" aria-labelledby="entry-title">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-kicker">ארבעה מסלולים</div>
          <h2 className="sec-title" id="entry-title">
            איך תרצו להתחיל?
          </h2>
          <p className="sec-desc">בחרו מסלול — ונמשיך משם בדיוק למה שמתאים לכם.</p>
        </div>

        <div className="entry-grid">
          {FULL.map((p) => (
            <Card p={p} key={p.href} />
          ))}
        </div>
      </div>
    </section>
  );
}
