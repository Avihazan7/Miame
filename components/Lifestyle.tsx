export default function Lifestyle() {
  return (
    <section className="block life-sec">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-kicker">לייפסטייל</div>
          <h2 className="sec-title">הכי חכם · בעיר ובשטח</h2>
          <p className="sec-desc">
            חוויה של דו־גלגלי עם יציבות של ארבעה. נסיעה חלקה, בטוחה ומהנה · בכל מקום שתבחרו.
          </p>
        </div>
        <div className="life-grid">
          <div className="life-card">
            <img src="/mia-ride.jpg" alt="רכיבה בשטח על מיה פור בזריחה" loading="lazy" />
            <div className="life-cap">
              <b>חופש בשטח</b>
              <span>יציבות 4×4 וביטחון על כל משטח</span>
            </div>
          </div>
          <div className="life-card">
            <img src="/mia-fold-lot.jpg" alt="מיה פור מקופלת · נכנסת לכל מקום" loading="lazy" />
            <div className="life-cap">
              <b>מתקפל · נכנס לכל מקום</b>
              <span>42 ק״ג · מהשטח ישר לתא המטען</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
