export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-logo">
          Mia<span className="dot">Me</span>
        </div>
        <div className="foot-powered">
          מבית <b>Leasing.co.il</b> 🎯
        </div>
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
