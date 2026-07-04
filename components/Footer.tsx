import MiaMark from "./MiaMark";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-brand">
          <span className="foot-mark">
            <MiaMark size={46} title="MiaMe" />
          </span>
          <div className="foot-logo">
            Mia<span className="dot">Me</span>
          </div>
        </div>
        <div className="foot-tag">
          <span aria-hidden="true">🌐</span> Free Feel
          <span className="sep">·</span>
          <span aria-hidden="true">🗽</span>
        </div>
        <div className="foot-powered">
          מבית{" "}
          <a href="https://www.leasing.co.il" target="_blank" rel="noopener">
            <b>Leasing.co.il</b>
          </a>{" "}
          🎯
        </div>
        <nav className="foot-links" aria-label="מידע משפטי">
          <a href="/legal/terms">תקנון ותנאי שימוש</a>
          <a href="/legal/privacy">מדיניות פרטיות</a>
          <a href="/legal/accessibility">הצהרת נגישות</a>
        </nav>
        <p className="foot-legal">
          המחירים, התשלומים החודשיים ותנאי המימון המוצגים באתר הם הערכה ראשונית
          בלבד לצורך התרשמות, ואינם מהווים הצעה מחייבת, ייעוץ או התחייבות למימון.
          התשלום החודשי המשוער מחושב כיתרה לאחר מקדמה ובלון, מחולקת במספר התשלומים,
          ללא ריבית והצמדה. ההתקשרות הסופית, תנאיה והעמדת המימון כפופים לאישור פרטני
          ולחתימה על הסכם. כל הזכויות שמורות ל-Leasing.co.il · {year}.
        </p>
      </div>
    </footer>
  );
}
