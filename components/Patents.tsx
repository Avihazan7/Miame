export default function Patents() {
  return (
    <section className="block patents-sec">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-kicker">מוגן בפטנט · פלטפורמת MIA Dynamics</div>
          <h2 className="sec-title">טכנולוגיה רשומה ומוגנת</h2>
          <p className="sec-desc">
            פלטפורמת המזעור של MIA Dynamics שומרת על יציבות של 4 גלגלים בכלי קומפקטי, ומחוללת מהפכה במיקרו־ניידות. מוגנת בפטנטים רשומים בארה"ב ובישראל · חדשנות אמיתית, לא חיקוי.
          </p>
        </div>
        <div className="patents-grid">
          <div className="patent">
            <div className="patent-flag">🇺🇸</div>
            <div className="patent-no">US 11,878,763 B2</div>
            <div className="patent-rg">United States Patent</div>
          </div>
          <div className="patent">
            <div className="patent-flag">🇺🇸</div>
            <div className="patent-no">US 12,097,926 B2</div>
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
          <span className="patents-tag">🏆 PATENTED · Miniaturized Four-Wheel Technology</span>
        </div>
      </div>
    </section>
  );
}
