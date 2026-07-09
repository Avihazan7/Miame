import { HOME_FAQ } from "@/lib/home-faq";

// Visible homepage FAQ (native <details>, no JS). Shares HOME_FAQ with the FAQPage
// JSON-LD in app/layout.tsx, so the rich result can never claim an answer the
// visitor can't read on the page.
export default function FaqHome() {
  return (
    <section className="block faq-home" id="faq" aria-labelledby="faq-home-title">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-kicker">שאלות נפוצות</div>
          <h2 className="sec-title" id="faq-home-title">
            כל מה שרציתם לדעת
          </h2>
        </div>
        <div className="faq-home-list">
          {HOME_FAQ.map((f) => (
            <details className="faq-home-item" key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
