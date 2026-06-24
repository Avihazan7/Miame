export default function Specs() {
  return (
    <section className="block specs-sec" id="specs">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-kicker">מפרט טכני</div>
          <h2 className="sec-title">כל מה שמתחת למעטפת</h2>
          <p className="sec-desc">
            הנדסה מדויקת, רכיבים איכותיים ושליטה מלאה. כל הנתונים במקום אחד.
          </p>
        </div>
        <div className="specs-wrap">
          <div className="specs-media">
            <img className="floaty" src="/miame-cockpit.webp" alt="תא נהג מיה פור · בקרה מלאה" />
          </div>
          <div className="specs-table">
            <div className="spec-row">
              <span className="spec-k">מהירות מרבית</span>
              <span className="spec-v">12 קמ"ש</span>
            </div>
            <div className="spec-row">
              <span className="spec-k">טווח נסיעה</span>
              <span className="spec-v">עד 100 ק"מ ריאלי · יצרן עד 120 ק"מ*</span>
            </div>
            <div className="spec-row">
              <span className="spec-k">מנועים</span>
              <span className="spec-v">2 או 4 · BLDC · 1,800W כל אחד</span>
            </div>
            <div className="spec-row">
              <span className="spec-k">סוללה</span>
              <span className="spec-v">ליתיום נשלפת 60V · 25/35Ah</span>
            </div>
            <div className="spec-row">
              <span className="spec-k">משקל סוללה</span>
              <span className="spec-v">6.3 ק"ג · תאי LG 21700</span>
            </div>
            <div className="spec-row">
              <span className="spec-k">מידות (ר×א×ג)</span>
              <span className="spec-v">689 × 1,244 × 1,190 מ"מ</span>
            </div>
            <div className="spec-row">
              <span className="spec-k">משקל הכלי</span>
              <span className="spec-v">42 ק"ג (דגם 4×2) · עד 136 ק"ג עומס</span>
            </div>
            <div className="spec-row">
              <span className="spec-k">בלמים</span>
              <span className="spec-v">דיסק הידראולי כפול · 140 מ"מ</span>
            </div>
            <div className="spec-row">
              <span className="spec-k">תקן ותקנות</span>
              <span className="spec-v">EN17128 · מותאם לתקנות הקלנועית בישראל</span>
            </div>
          </div>
        </div>
        <p
          className="spec-note"
          style={{ marginTop: "16px", fontSize: "13px", lineHeight: 1.6, color: "#8a93a3" }}
        >
          * נתון טווח היצרן נמדד בתנאי מעבדה. הטווח בפועל מושפע ממשקל הנהג, תוואי הדרך, תנאי השטח וסגנון הנהיגה.
        </p>
      </div>
    </section>
  );
}
