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
            <img src="/miame-life-1.webp" alt="חופש בשטח · מיה פור" />
            <div className="life-cap">
              <b>חופש בשטח</b>
              <span>יציבות וביטחון על כל משטח</span>
            </div>
          </div>
          <div className="life-card">
            <img src="/miame-life-2.webp" alt="אלגנטיות בעיר · מיה פור" />
            <div className="life-cap">
              <b>אלגנטיות בעיר</b>
              <span>קלה, שקטה וחסכונית ליום־יום</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
