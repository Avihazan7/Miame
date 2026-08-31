import Image from "next/image";
import WaCta from "@/components/WaCta";
import { SPYQE, SPYQE_TOTAL, SPYQE_SAVING, ils } from "@/lib/spyqe";

/**
 * SPYQE — the platform's second model, sold as a pre-order.
 *
 * The card design is unchanged from the teaser it grew out of; what changed is
 * that it now carries a real offer instead of "coming soon". The headline is the
 * MONTHLY payment, because that is how the owner quoted it and how a buyer feels
 * it — the total and the saving support it rather than compete with it.
 *
 * ⚠ NO SPECIFICATION IS SHOWN, on purpose. See lib/spyqe.ts. The line about the
 *   full spec being published on confirmation is not a placeholder to fill in
 *   later with MIA FOUR's numbers — it is the honest state, said out loud.
 *
 * ⚠ The 248 cap is a REAL allocation the owner stated, phrased as a condition of
 *   entry ("248 הנרשמים הראשונים"), never as a live remaining-stock counter. The
 *   difference is the whole point of lib/deal-buzz.ts's no-fake-scarcity contract,
 *   which test/spyqeOffer.test.ts now applies to this copy too.
 */

// The real SPYQE frames in /public. The three 1000px files are named
// "mia-four-teal-*" for historical reasons but every one of them shows SPYQE.
const SHOTS = [
  { src: "/mia-four-teal-side.webp", w: 1000, h: 1000, alt: "SPYQE · פרופיל צד מלא" },
  { src: "/mia-four-teal-cockpit.webp", w: 1000, h: 1000, alt: "SPYQE · תא נהג, כידון ותצוגה" },
  { src: "/mia-four-teal-wheel.webp", w: 1000, h: 1000, alt: "SPYQE · גלגל ומתלה מקרוב" },
];

export default function Spyqe() {
  return (
    <section className="block" id="spyqe" aria-labelledby="spyqe-title">
      <div className="wrap">
        <div className="soon-card">
          <div className="soon-media">
            {/* The 3/4 studio hero. It sat unused in /public while the section
                showed only detail crops — this is the frame that says what the
                vehicle IS at a glance. */}
            <Image
              className="soon-hero"
              src="/miame-spyqe.webp"
              alt="MIA SPYQE 2×4 · מבט חזית-צד, ארבעה גלגלים"
              width={560}
              height={582}
              sizes="(max-width: 780px) 88vw, 40vw"
            />

            <div className="soon-gallery">
              {SHOTS.map((s) => (
                <div className="soon-tile" key={s.src}>
                  <Image src={s.src} alt={s.alt} width={s.w} height={s.h} sizes="30vw" loading="lazy" />
                </div>
              ))}
            </div>
          </div>

          <div className="soon-txt">
            <span className="spq-kicker">הזמנה מוקדמת · דגם חדש</span>
            <div className="soon-title" id="spyqe-title">
              {SPYQE.name}
            </div>
            <p className="soon-sub">
              {SPYQE.full} — הדגם השני על פלטפורמת MIA Dynamics, ובקרוב אצלכם.
              המשלוח הראשון לישראל יוצא לדרך, וההרשמה אליו פתוחה עכשיו.
            </p>

            {/* The offer. Monthly first, at display size; everything else supports it. */}
            <div className="spq-offer">
              <div className="spq-price">
                <span className="spq-monthly">{ils(SPYQE.monthlyPayment)}</span>
                <span className="spq-per">× {SPYQE.months} תשלומים</span>
              </div>
              <div className="spq-totals">
                <b>{ils(SPYQE_TOTAL)}</b>
                <s>{ils(SPYQE.listPrice)}</s>
                <span className="spq-save">חיסכון {ils(SPYQE_SAVING)}</span>
              </div>
              <ul className="spq-terms">
                <li>ללא ריבית והצמדה</li>
                <li>ל-{SPYQE.slots} הנרשמים הראשונים</li>
                <li>אספקה משוערת עד {SPYQE.deliveryBusinessDays} ימי עסקים</li>
              </ul>
            </div>

            <div className="soon-cta">
              <WaCta cta="spyqe" variant="primary" block />
              <p className="soon-note">
                המפרט המלא של {SPYQE.name} יפורסם עם אישור היבואן — אנחנו לא מפרסמים
                נתון שלא אומת. ההרשמה שומרת מקום במשלוח הראשון ואינה מחייבת ברכישה.
                הכמות, המחיר ומועד האספקה כפופים לעדכון ולאישור החברה/היבואן.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
