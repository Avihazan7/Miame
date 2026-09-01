import { HOME_FAQ } from "@/lib/home-faq";
import WaCta from "@/components/WaCta";

// Visible homepage FAQ (native <details>, no JS). Shares HOME_FAQ with the FAQPage
// JSON-LD in app/page.tsx — it moved out of the root layout, where it was being
// injected into all thirteen routes including pages that render none of these
// answers. The coupling is physical on purpose: the rich result can never claim an
// answer a visitor cannot read on the page.
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
        <div className="faq-home-out">
          <WaCta cta="faq" variant="light" />
        </div>
      </div>
    </section>
  );
}
