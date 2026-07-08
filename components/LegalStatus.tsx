// LegalStatus — the קלנועית differentiation. Mia FOUR is classified as a mobility
// scooter (קלנועית), NOT a road vehicle like the Leasing.co.il / ULease car
// catalog: identified by a chassis number (no licence plate), no registration
// fees, and exempt from the fines a motorised two-wheeler absorbs. That's a real
// conversion lever, so it gets its own section right before the deal simulator.

function StatusIc({ d }: { d: string }) {
  return (
    <div className="status-ic">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d={d} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

const STATUS = [
  {
    d: "M3 5h18v14H3zM7 9h6M7 13h10M7 17h4",
    title: "מספר שילדה, לא לוחית",
    text: "כל כלי מזוהה במספר שילדה ייחודי עם ת\"ז מלאה מהיצור — בלי רישוי ובלי לוחית.",
  },
  {
    d: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
    title: "אפס אגרות",
    text: "ללא אגרת רישוי וללא עלויות הרישוי השנתיות שגוררת בעלות על רכב.",
  },
  {
    d: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4zM4 5l16 14",
    title: "פחות חשיפה לדוחות",
    text: "לפי המעמד החוקי של קלנועית ובכפוף לדין — אינה חשופה לחלק מהקנסות והדוחות שדו-גלגלי ממונע סופג. השימוש תמיד בכפוף לתקנות.",
  },
  {
    d: "M12 3l8 4v5c0 4.5-3.5 7.5-8 9-4.5-1.5-8-4.5-8-9V7zM9 12l2 2 4-4",
    title: "תקן קלנועית",
    text: "תואמת תקן EN17128 ומותאמת לתקנות הקלנועית בישראל — ניידות אישית כשורה.",
  },
];

export default function LegalStatus() {
  return (
    <section className="block status-sec" id="status">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-kicker">מעמד חוקי · קלנועית</div>
          <h2 className="sec-title">קלנועית, לא רכב — וזה כל ההבדל</h2>
          <p className="sec-desc">
            מיה פור מסווגת כקלנועית, להבדיל מכלי הרכב של Leasing.co.il: מזוהה במספר
            שילדה עם ת"ז כלי מלאה מהיצור — בלי לוחית רישוי, בלי אגרות, ובלי הדוחות
            שדו-גלגלי ממונע סופג. כל החופש של ניידות אישית, אפס הבירוקרטיה של רכב.
          </p>
        </div>

        <div className="status-grid">
          {STATUS.map((s) => (
            <div className="status-card" key={s.title}>
              <StatusIc d={s.d} />
              <div className="status-k">{s.title}</div>
              <div className="status-v">{s.text}</div>
            </div>
          ))}
        </div>

        <p className="status-note">
          המעמד החוקי בכפוף לתקנות הקלנועית בישראל ולשימוש בהתאם להן.
        </p>

        <div className="legal-brief">
          <div className="lb-title">מה חשוב לדעת?</div>
          <ul className="lb-list">
            <li>קלנועית — ולא רכב.</li>
            <li>מספר שילדה, ללא לוחית רישוי.</li>
            <li>התאמה לתקנות הקלנועית בישראל.</li>
            <li>תקן <span className="ltr">EN17128</span>.</li>
            <li>שימוש בכפוף לדין ולתנאי הדרך.</li>
          </ul>
        </div>

        <p className="status-legal">
          המידע בעמוד זה מנוסח באופן כללי ואינו מהווה ייעוץ משפטי פרטני. השימוש בכלי
          כפוף לדין, לתקנות הקלנועית בישראל, להוראות הרשויות ולתנאי היבואן.
        </p>
      </div>
    </section>
  );
}
