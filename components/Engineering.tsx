import Image from "next/image";
import WaCta from "@/components/WaCta";
import LexIcon from "@/components/LexIcon";
// Engineering — the chassis deep-dive. Shows the real Mia FOUR 4×4 Pro Max frame (rear
// 3/4 cutout) on a dark stage with an azure glow that echoes the Deal Aura, plus
// the engineering highlights that the spec table only lists as numbers.
export default function Engineering() {
  return (
    <section className="block eng-sec" id="engineering">
      <div className="wrap">
        <div className="sec-head">
          <div className="sec-kicker">הנדסה · שלדת MIA FOUR 4×4 Pro Max</div>
          <h2 className="sec-title">מתחת למעטפת, שלדה שנבנתה לשטח</h2>
          <p className="sec-desc">
            מתלים עצמאיים לכל גלגל, פלטפורמת ארבעה גלגלים מוגנת פטנט וצמיגי שטח, 
            הנדסה שמרגישים בכל נסיעה, לא רק קוראים במפרט.
          </p>
        </div>

        <div className="eng-stage eng-stage--pair">
          <img
            className="eng-veh floaty"
            src="/mia-four-x4-rear.webp"
            alt="שלדת מיה פור 4×4 Pro Max · מתלים עצמאיים ופלטפורמת ארבעה גלגלים מוגנת פטנט"
            loading="lazy"
          width={934}
          height={521}
          />
          {/* ADDED, not swapped: the rear 3/4 is the right frame for "four-wheel
              platform" and nothing replaces it. What the section lacked was any
              close-up at all — every engineering claim above was a sentence beside a
              wide shot. This is the manufacturer's cockpit detail (2026-09-02), and
              it is the one frame on the site where the spec table's
              "דיסק הידראולי כפול" is actually VISIBLE: the hydraulic master cylinder,
              the lever, and the LOCK/UNLOCK collar. A claim a buyer can see. */}
          <Image
            className="eng-detail"
            src="/mia-four-x4-brake-detail.jpg"
            alt="מיה פור 4×4 Pro Max · תקריב כידון — בלם דיסק הידראולי, ידית ונעילת LOCK/UNLOCK"
            loading="lazy"
            quality={90}
            sizes="(min-width: 1120px) 527px, (max-width: 780px) 100vw, 48vw"
            width={1000}
            height={1000}
          />
        </div>

        <div className="eng-grid">
          <div className="eng-card">
            <div className="eng-ic"><LexIcon name="wrench" /></div>
            <div className="eng-k">מתלים עצמאיים</div>
            <div className="eng-v">קפיץ ספיגה ייעודי לכל גלגל, אחיזה ויציבות בכל תוואי.</div>
          </div>
          <div className="eng-card">
            <div className="eng-ic"><LexIcon name="shield" /></div>
            <div className="eng-k">פלטפורמת 4 גלגלים</div>
            <div className="eng-v">טכנולוגיית מזעור מוגנת פטנט, יציבות אמיתית בקלנועית קומפקטית.</div>
          </div>
          <div className="eng-card">
            <div className="eng-ic"><LexIcon name="wheel" /></div>
            <div className="eng-k">צמיגי שטח</div>
            <div className="eng-v">אחיזה רחבה לכל סוג כביש ושביל, בלי לוותר על נוחות.</div>
          </div>
          <div className="eng-card">
            <div className="eng-ic"><LexIcon name="brake" /></div>
            <div className="eng-k">בלימה הידראולית</div>
            <div className="eng-v">דיסק הידראולי כפול 140 מ"מ, עצירה בטוחה ומדויקת.</div>
          </div>
        </div>

        <div className="sec-wa-out">
          <WaCta cta="engineering" variant="ghost" />
        </div>
      </div>
    </section>
  );
}
