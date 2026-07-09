// M30.1 — "How ULease Works" flow strip. A calm, RTL, VISUAL-ONLY explainer of the
// marketplace process. Built from the text brief only — no external image/asset, no
// copied visual/layout/icon/color/text, no derivative graphic. No automation, no provider
// call, no DB write, no network. It never claims a negotiation happened; the caption marks
// it as an illustration.

import { HOW_IT_WORKS_TITLE, HOW_IT_WORKS_CAPTION, HOW_IT_WORKS_STEPS } from "@/lib/marketplace-preview";

export default function HowItWorksFlow() {
  return (
    <section className="mp-flow" aria-labelledby="mp-flow-title">
      <h2 id="mp-flow-title" className="mp-section-title">{HOW_IT_WORKS_TITLE}</h2>
      <ol className="mp-flow-list">
        {HOW_IT_WORKS_STEPS.map((s) => (
          <li key={s.index} className="mp-flow-step">
            <span className="mp-flow-num" aria-hidden="true">{s.index}</span>
            <span className="mp-flow-text">
              {s.text}
              {s.demo && <span className="mp-demo-badge">לדוגמה</span>}
            </span>
          </li>
        ))}
      </ol>
      <p className="mp-flow-caption">{HOW_IT_WORKS_CAPTION}</p>
    </section>
  );
}
