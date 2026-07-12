import LexIcon from "@/components/LexIcon";
export default function Patents() {
  return (
    <section className="block patents-sec">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-kicker">מוגן בפטנט · פלטפורמת MIA Dynamics</div>
          <h2 className="sec-title">טכנולוגיה רשומה ומוגנת</h2>
          <p className="sec-desc">
            פלטפורמת המזעור של MIA Dynamics שומרת על יציבות של 4 גלגלים בקלנועית קומפקטית, ומחוללת מהפכה במיקרו־ניידות. מוגנת בפטנטים רשומים בארה"ב ובישראל · חדשנות אמיתית, לא חיקוי.
          </p>
        </div>

        <div className="patent-showcase">
          <div className="ps-kicker">
            <span className="k">פטנטים ייחודיים · MIA</span>
          </div>
          <img
            src="/mia-four-x4-pure-freedom.webp"
            alt="MIA FOUR · Pure Freedom · טכנולוגיית ארבעה גלגלים ממוזערת מוגנת פטנט (PATENTED)"
            loading="lazy"
          />
          <div className="photo-cap">
            <b>Pure Freedom · מוגן פטנט</b>
            <span>עיצוב שזכה בהגנת פטנט רשום, חדשנות אמיתית, לא חיקוי</span>
          </div>
        </div>

        <div className="patents-grid">
          <div className="patent">
            <div className="patent-flag">🇺🇸</div>
            <div className="patent-no ltr">US 11,878,763 B2</div>
            <div className="patent-rg">United States Patent</div>
          </div>
          <div className="patent">
            <div className="patent-flag">🇺🇸</div>
            <div className="patent-no ltr">US 12,097,926 B2</div>
            <div className="patent-rg">United States Patent</div>
          </div>
          <div className="patent">
            <div className="patent-flag">🇮🇱</div>
            <div className="patent-no">IL 280339</div>
            <div className="patent-rg">פטנט ישראל</div>
          </div>
          <div className="patent">
            <div className="patent-flag">🇮🇱</div>
            <div className="patent-no">IL 285336</div>
            <div className="patent-rg">פטנט ישראל</div>
          </div>
        </div>
        <div className="patents-tag-wrap">
          <span className="patents-tag"><LexIcon name="trophy" /> PATENTED · Miniaturized Four-Wheel Technology</span>
        </div>
      </div>
    </section>
  );
}
