// M30.1 — Leasing terms explainer. A Hebrew-first, RTL, VISUAL-ONLY education section:
// 10 plain-language cards, each with a short explanation and one practical meaning. No
// legal overpromise, no fake AI claim. Deal Score is marked "לדוגמה" (illustrative in this
// preview). No external image/asset, no automation, no provider/API/DB, no network.

import { LEASING_TERMS_TITLE, LEASING_TERMS } from "@/lib/marketplace-preview";

export default function LeasingTermsExplainer() {
  return (
    <section className="mp-terms" aria-labelledby="mp-terms-title">
      <h2 id="mp-terms-title" className="mp-section-title">{LEASING_TERMS_TITLE}</h2>
      <div className="mp-terms-grid">
        {LEASING_TERMS.map((t) => (
          <article key={t.term} className="mp-term">
            <h3 className="mp-term-name">
              {t.term}
              {t.demo && <span className="mp-demo-badge">לדוגמה</span>}
            </h3>
            <p className="mp-term-explain">{t.explain}</p>
            <p className="mp-term-meaning">
              <span className="mp-term-meaning-label">מה זה אומר לכם: </span>
              {t.meaning}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
