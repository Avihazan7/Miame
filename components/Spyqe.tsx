import Image from "next/image";
import WaCta from "@/components/WaCta";
import SpyqeVideo from "@/components/SpyqeVideo";
import {
  SPYQE,
  SPYQE_TOTAL,
  SPYQE_SAVING,
  SPYQE_BALANCE,
  SPYQE_SPEC,
  SPYQE_SPEC_SOURCE,
  ils,
} from "@/lib/spyqe";

/**
 * SPYQE — the platform's second model, sold as a pre-order.
 *
 * The card design is unchanged from the teaser it grew out of; what changed is
 * that it now carries a real offer instead of "coming soon". The headline is the
 * MONTHLY payment, because that is how the owner quoted it and how a buyer feels
 * it — the total and the saving support it rather than compete with it.
 *
 * The spec table is the manufacturer's own, captured by the owner on 31.08.26 and
 * recorded in docs/evidence/spyqe-2026-08-31/. Two things it does NOT carry: the
 * source's foreign top-speed figures (Israel is a קלנועית market, ceiling 25),
 * and any field the captured table stopped short of. See lib/spyqe.ts.
 *
 * ⚠ The 248 cap is a REAL allocation the owner stated, phrased as a condition of
 *   entry ("248 הזוכים הראשונים"), never as a live remaining-stock counter. The
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

            <SpyqeVideo />

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
              {/* The two-step structure, stated before the CTA rather than after
                  it: a registrant is never asked for the full amount against a
                  vehicle that has not landed, and that is the reassurance that
                  makes a pre-order signable. */}
              <ol className="spq-steps">
                <li>
                  <b>{ils(SPYQE.deposit)}</b>
                  <span>מקדמה ליבואן, בהרשמה</span>
                </li>
                <li>
                  <b>{ils(SPYQE_BALANCE)}</b>
                  <span>
                    היתרה ב-{SPYQE.months} תשלומים של {ils(SPYQE.monthlyPayment)}, מהגעת המשלוח
                    למחסני היבואן
                  </span>
                </li>
              </ol>
              <ul className="spq-terms">
                <li>ללא ריבית והצמדה</li>
                <li>ל-{SPYQE.slots} הזוכים הראשונים</li>
                <li>אספקה משוערת עד {SPYQE.deliveryBusinessDays} ימי עסקים</li>
              </ul>
            </div>

            <table className="spq-spec">
              <caption className="sr-only">מפרט טכני · {SPYQE.full}</caption>
              <tbody>
                {SPYQE_SPEC.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td>
                      <span className="spq-spec-v">{row.value}</span>
                      {row.note ? <span className="spq-spec-n">{row.note}</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="spq-spec-src">
              {SPYQE_SPEC_SOURCE.label} · נקלט {SPYQE_SPEC_SOURCE.capturedAt}
            </p>

            <div className="soon-cta">
              <WaCta cta="spyqe" variant="primary" block />
              <p className="soon-note">
                המפרט לעיל הוא של היצרן. נתון שאינו מופיע בו — משקל, עומס מרבי, זמן
                טעינה — יפורסם כשיאומת, ולא לפני. ההרשמה שומרת מקום במשלוח הראשון
                ואינה מחייבת ברכישה. הכמות, המחיר ומועד האספקה כפופים לעדכון
                ולאישור החברה/היבואן.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
