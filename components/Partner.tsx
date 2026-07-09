import PartnerCta from "./PartnerCta";
import PartnerHubForm from "./PartnerHubForm";
import { RENTAL_PRICES, SUCCESS_FEE_PCT } from "@/lib/content";

function Icon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const FLOW = [
  {
    d: "M3 7h18M3 12h18M3 17h18",
    t: "אתם מחזיקים את הצי",
    p: "השותף רוכש, מתחזק וטוען את הכלים. אתם הבעלים."
  },
  {
    d: "M12 3l7 4v6c0 4-3 6-7 8-4-2-7-4-7-8V7l7-4z",
    t: "אנחנו מביאים את הביקוש",
    p: "MiaMe מביאה שיווק, לידים וחשיפה וממלאת לכם את היומן."
  },
  {
    d: "M20 6L9 17l-5-5",
    t: "משלמים רק על תוצאה",
    p: `${SUCCESS_FEE_PCT}% Success Fee מהפניות בלבד. אפס עלות קבועה.`
  }
];

export default function Partner() {
  return (
    <section className="block partner-sec" id="partner">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-kicker">שותפות עסקית</div>
          <h1 className="sec-title">הפכו ל-MiaMe Hub</h1>
          <p className="sec-desc">
            מודל שותפות פשוט להפעלת צי השכרה רווחי, בלי להיכנס לעולם השיווק לבד.
          </p>
        </div>

        <div className="partner-grid">
          <div className="partner-card">
            <h3 className="partner-h">איך זה עובד</h3>
            <p className="partner-p">שלושה צעדים, מודל רזה, מדיד וללא עלות קבועה.</p>

            <div className="flow">
              {FLOW.map((f) => (
                <div className="flow-item" key={f.t}>
                  <div className="flow-ic">
                    <Icon d={f.d} />
                  </div>
                  <div>
                    <div className="flow-t">{f.t}</div>
                    <div className="flow-d">{f.p}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="fee-badge">{SUCCESS_FEE_PCT}% Success Fee · מהפניות בלבד</div>
          </div>

          <div className="partner-card dark">
            <div className="pl-title">מחירון השכרה לדוגמה</div>
            <div className="price-list">
              {RENTAL_PRICES.map((p) => (
                <div className="pl-row" key={p.k}>
                  <span className="pl-k">{p.k}</span>
                  <span className="pl-v">
                    <span className="cur">₪</span>
                    {p.v}
                  </span>
                </div>
              ))}
            </div>
            <PartnerHubForm />
            <div className="partner-cta">
              <PartnerCta />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
