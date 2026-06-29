export default function Lifestyle() {
  return (
    <section className="block life-sec">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-kicker">לייפסטייל</div>
          <h2 className="sec-title">חכם בעיר ועוצמתי בשטח</h2>
          <p className="sec-desc">
            חוויה של דו־גלגלי עם יציבות ובטיחות של ארבעה. נסיעה חלקה, בטוחה ומהנה בתוואי
            רכיבה משתנה — הודות למערכת מתלים מתקדמת מוגנת פטנט והנעה חשמלית שקטה וירוקה.
          </p>
        </div>
        <div className="life-grid">
          <div className="life-card">
            <img src="/mia-fold-lot.jpg" alt="מיה פור מקופלת · נכנסת לכל מקום" loading="lazy" />
            <div className="life-cap">
              <b>חכם בעיר</b>
              <span>מתקפל · נייד · 42 ק״ג, נכנס לכל מקום</span>
            </div>
          </div>
          <div className="life-card">
            <img src="/mia-wheel-detail.webp" alt="מתלים וצמיגי שטח · MIA Dynamics" loading="lazy" />
            <div className="life-cap">
              <b>עוצמתי בשטח</b>
              <span>מתלים מלאים · צמיגי שטח MIA Dynamics</span>
            </div>
          </div>
          <div className="life-card">
            <img src="/mia-four-x4-night-rear.jpg" alt="מיה פור X4 · גימור סטודיו, מתלה אחורי ומערכת שיכוך חשופה" loading="lazy" />
            <div className="life-cap">
              <b>עיצוב שמדבר</b>
              <span>נוכחות פרימיום · גימור ננו־קריסטל, אמין ורגוע</span>
            </div>
          </div>
          <div className="life-card">
            <img src="/mia-four-x4-seat.webp" alt="מיה פור X4 עם כיסא בשחרור מהיר · ישיבה או עמידה" loading="lazy" />
            <div className="life-cap">
              <b>ישיבה או עמידה</b>
              <span>כיסא בשחרור מהיר ביד אחת · נוחות לכל אורך הדרך</span>
            </div>
          </div>
        </div>
        <div className="life-band photo-frame">
          <img src="/mia-beach.webp" alt="מיה פור על קו החוף · חופש בכל מקום" loading="lazy" />
          <div className="photo-cap">
            <b>חופש אמיתי — בכל מקום</b>
            <span>מהעיר, דרך החוף, אל השטח</span>
          </div>
        </div>
      </div>
    </section>
  );
}
