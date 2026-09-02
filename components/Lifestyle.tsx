import Image from "next/image";

export default function Lifestyle() {
  return (
    <section className="block life-sec">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-kicker">לייפסטייל</div>
          <h2 className="sec-title">חכם בעיר ועוצמתי בשטח</h2>
          <p className="sec-desc">
            חוויה של דו־גלגלי עם יציבות ובטיחות של ארבעה. נסיעה חלקה, בטוחה ומהנה בתוואי
            רכיבה משתנה, הודות למערכת מתלים מתקדמת מוגנת פטנט והנעה חשמלית שקטה וירוקה.
          </p>
        </div>
        <div className="life-grid">
          <div className="life-card">
            {/* These five were plain <img>: five full-resolution originals, 353 KB
                between them, shipped whole with no srcset. The four cards sit in a
                one-column grid that becomes two columns at 780px (.life-grid), and
                the band below is full width — that is what the `sizes` strings say.
                The attributes stay the file's TRUE intrinsic size, exactly as
                test/imageLayout.test.ts requires, so the reserved box is unchanged
                and this buys bytes without buying layout shift. */}
            <Image sizes="(min-width: 1120px) 527px, (min-width: 780px) 50vw, 100vw" src="/mia-fold-lot.webp" alt="מיה פור מקופלת · נכנסת לכל מקום" loading="lazy"
          width={1100}
          height={733} />
            <div className="life-cap">
              <b>חכם בעיר</b>
              <span>מתקפל · נייד · 42 ק״ג, נכנס לכל מקום</span>
            </div>
          </div>
          <div className="life-card">
            <Image sizes="(min-width: 1120px) 527px, (min-width: 780px) 50vw, 100vw" src="/mia-wheel-detail.webp" alt="מתלים וצמיגי שטח · MIA Dynamics" loading="lazy"
          width={1000}
          height={1000} />
            <div className="life-cap">
              <b>עוצמתי בשטח</b>
              <span>מתלים מלאים · צמיגי שטח MIA Dynamics</span>
            </div>
          </div>
          <div className="life-card">
            <Image sizes="(min-width: 1120px) 527px, (min-width: 780px) 50vw, 100vw" src="/mia-four-x4-night-rear.jpg" alt="מיה פור 4×4 Pro Max · גימור סטודיו, מתלה אחורי ומערכת שיכוך חשופה" loading="lazy"
          width={1080}
          height={1080} />
            <div className="life-cap">
              <b>עיצוב שמדבר</b>
              <span>נוכחות פרימיום · קווים נקיים, אמין ורגוע</span>
            </div>
          </div>
          <div className="life-card">
            <Image sizes="(min-width: 1120px) 527px, (min-width: 780px) 50vw, 100vw" src="/mia-four-x4-seat.webp" alt="מיה פור 4×4 Pro Max עם כיסא בשחרור מהיר · ישיבה או עמידה" loading="lazy"
          width={900}
          height={880} />
            <div className="life-cap">
              <b>ישיבה או עמידה</b>
              <span>כיסא בשחרור מהיר ביד אחת · נוחות לכל אורך הדרך</span>
            </div>
          </div>
        </div>
        <div className="life-band photo-frame">
          <Image sizes="(min-width: 1120px) 1076px, 100vw" src="/mia-beach.webp" alt="מיה פור על קו החוף · חופש בכל מקום" loading="lazy"
          width={960}
          height={640} />
          <div className="photo-cap">
            <b>חופש אמיתי, בכל מקום</b>
            <span>מהעיר, דרך החוף, אל השטח</span>
          </div>
        </div>
      </div>
    </section>
  );
}
