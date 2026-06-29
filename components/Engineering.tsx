// Engineering — the chassis deep-dive. Shows the real Mia FOUR X4 frame (rear
// 3/4 cutout) on a dark stage with an azure glow that echoes the Deal Aura, plus
// the engineering highlights that the spec table only lists as numbers.
export default function Engineering() {
  return (
    <section className="block eng-sec" id="engineering">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-kicker">הנדסה · שלדת MIA FOUR X4</div>
          <h2 className="sec-title">מתחת למעטפת — שלדה שנבנתה לשטח</h2>
          <p className="sec-desc">
            מתלים עצמאיים לכל גלגל, פלטפורמת ארבעה גלגלים מוגנת פטנט וצמיגי שטח —
            הנדסה שמרגישים בכל נסיעה, לא רק קוראים במפרט.
          </p>
        </div>

        <div className="eng-stage">
          <img
            className="eng-veh floaty"
            src="/mia-four-x4-rear.webp"
            alt="שלדת מיה פור X4 · מתלים עצמאיים ופלטפורמת ארבעה גלגלים מוגנת פטנט"
            loading="lazy"
          />
        </div>

        <div className="eng-grid">
          <div className="eng-card">
            <div className="eng-ic">🔧</div>
            <div className="eng-k">מתלים עצמאיים</div>
            <div className="eng-v">קפיץ ספיגה ייעודי לכל גלגל — אחיזה ויציבות בכל תוואי.</div>
          </div>
          <div className="eng-card">
            <div className="eng-ic">🛡️</div>
            <div className="eng-k">פלטפורמת 4 גלגלים</div>
            <div className="eng-v">טכנולוגיית מזעור מוגנת פטנט — יציבות אמיתית בכלי קומפקטי.</div>
          </div>
          <div className="eng-card">
            <div className="eng-ic">🛞</div>
            <div className="eng-k">צמיגי שטח</div>
            <div className="eng-v">אחיזה רחבה לכל סוג כביש ושביל — בלי לוותר על נוחות.</div>
          </div>
          <div className="eng-card">
            <div className="eng-ic">🛑</div>
            <div className="eng-k">בלימה הידראולית</div>
            <div className="eng-v">דיסק הידראולי כפול 140 מ"מ — עצירה בטוחה ומדויקת.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
