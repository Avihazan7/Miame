import { CTA } from "@/lib/cta";

// Entry paths — give a first-time visitor a clear route within 3 seconds:
// buy · rent in Eilat · defence-forces eligibility · partner Hub. The four living
// paths named in the Master Spec (docs/MIAME_MASTER_SPEC.md, principle 10). Pure
// anchors to existing in-page sections (no JS, no new flow). Additive; calm,
// dark-navy anchored — the site is not redesigned.

const PATHS = [
  {
    href: "#sim",
    icon: "🛒",
    title: "רכישת MIA FOUR",
    desc: "בונים הצעת תשלום — עד 18 תשלומים ללא ריבית והצמדה.",
    cta: CTA.fit,
    tone: "buy",
  },
  {
    href: "#rental",
    icon: "♻️",
    title: "השכרה באילת",
    desc: "צי השכרה לפי שעה ב-Green Extreme · פארק הטרמינל.",
    cta: CTA.rental,
    tone: "rent",
  },
  {
    href: "#tribute",
    icon: "🇮🇱",
    title: "זכאות כוחות הביטחון",
    desc: "נכי צה\"ל ומשפחות שכולות — עד 100% בכפוף לאישור.",
    cta: CTA.tribute,
    tone: "tribute",
  },
  {
    href: "#partner",
    icon: "🤝",
    title: "MiaMe Hub לשותפים",
    desc: "מפעילים צי השכרה רווחי — אתם הבעלים, אנחנו מביאים ביקוש.",
    cta: CTA.partner,
    tone: "partner",
  },
] as const;

export default function EntryPaths() {
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
          {PATHS.map((p) => (
            <a className={`entry-card entry-${p.tone}`} href={p.href} key={p.href}>
              <span className="entry-ic" aria-hidden="true">
                {p.icon}
              </span>
              <span className="entry-title">{p.title}</span>
              <span className="entry-desc">{p.desc}</span>
              <span className="entry-cta">{p.cta} ›</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
