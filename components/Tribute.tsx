import Image from "next/image";
import WaCta from "@/components/WaCta";
import LexIcon from "@/components/LexIcon";
import { getModel } from "@/lib/models";

/**
 * Ministry of Defence eligibility — the second conversion path on the site, and
 * on /eligibility the whole page.
 *
 * EVERY NUMBER AND CAVEAT BELOW IS LEGALLY REVIEWED AND FROZEN: the "עד 100%"
 * framing, the 90% recognised subsidy, the 10% MEU grant, the 17,988 ₪ figure
 * and the full disclaimer. Copy around them may be improved; those may not be
 * changed without a fresh legal read.
 *
 * `priority` is set on /eligibility only, where the Mia image is the LCP element.
 */
export default function Tribute({
  priority = false,
  deepLink = false,
}: {
  priority?: boolean;
  /** Homepage only: link through to the dedicated /eligibility page.
      Without this the removal of the entry-path grid leaves /eligibility with
      no inbound link from the homepage at all — orphaned for crawlers and
      invisible to anyone who does not open the WhatsApp chat. */
  deepLink?: boolean;
}) {
  // The worksheet below starts from the entry model's price. It was typed here,
  // so a price change in lib/models.ts would have left the Ministry of Defence
  // calculator quoting a stale number on the one page where the arithmetic under
  // it IS the argument. The frozen figures above (90% / 10% / 17,988 ₪) are legal
  // text and stay literal; this one is a catalogue price and is now read.
  const entry = getModel("4x2");

  return (
    <section className="block tribute-sec" id="tribute">
      <div className="wrap">
        <div className="sec-head">
          <span className="tribute-flag">הוקרה והנגשה</span>
          <h2 className="sec-title" style={{ marginTop: "8px" }}>
            מיה פור מצדיעה לכוחות הביטחון
          </h2>
          <p className="sec-desc">
            נכי צה״ל, כוחות הביטחון ובני משפחות שכולות · בכפוף לבדיקת זכאות במשרד
            הביטחון. אנחנו מלווים אתכם בתהליך מול האגף הרלוונטי, מהבדיקה ועד המסירה.
          </p>
        </div>

        <div className="tribute-wrap">
          <div className="tribute-media">
            <div className="tribute-badge">
              <span className="tb-pre">עד</span>
              100%<small>סבסוד*</small>
            </div>
            <Image
              className="floaty"
              src="/mia-white.webp"
              alt="מיה פור · הקלנועית המלאה, בתצורה המוצעת לזכאי כוחות הביטחון"
              width={900}
              height={880}
              sizes="(max-width: 899px) 92vw, 450px"
              priority={priority}
              loading={priority ? "eager" : "lazy"}
            />
          </div>

          <div className="tribute-body">
            <div className="elig-card">
              <div className="elig-head">
                <h3>נכי צה״ל וכוחות הביטחון</h3>
                <span className="elig-tag">אגף השיקום</span>
              </div>
              <p className="elig-body">
                קלנועית במימון משרד הביטחון, בהתאם לזכאות הרפואית והתפקודית ·{" "}
                <b>עד 100% מוכר לסבסוד*</b>.
              </p>
              <a
                className="elig-link"
                href="https://shikum.mod.gov.il/medical/equipment/wheelchairs"
                target="_blank"
                rel="noopener"
              >
                פרטי הזכאות באגף השיקום ←
              </a>
            </div>

            <div className="elig-card">
              <div className="elig-head">
                <h3>בני משפחות שכולות</h3>
                <span className="elig-tag">אגף משפחות והנצחה</span>
              </div>
              <p className="elig-body">
                מענק לרכישת קלנועית יחיד, פעם ב־4 שנים · <b>עד 17,988 ₪</b> לאלמן/ה,{" "}
                <b>שהם עד 90% מוכרים לסבסוד*</b>.
              </p>
              <a
                className="elig-link"
                href="https://mishpahot-hantzaha.mod.gov.il/transportation/scooter"
                target="_blank"
                rel="noopener"
              >
                פרטי הזכאות באגף משפחות והנצחה ←
              </a>
            </div>

            <div className="tribute-calc">
              <div className="tc-head">
                <LexIcon name="gift" /> לזכאי כוחות הביטחון · מיה פור{" "}
                <bdi dir="ltr">{entry.name}</bdi>
              </div>
              <div className="tc-row">
                <b>
                  מחיר מיה פור <bdi dir="ltr">{entry.name}</bdi>
                </b>
                <span>{entry.price.toLocaleString("he-IL")} ₪</span>
              </div>
              <div className="tc-row tc-sub">
                <b>סבסוד מוכר · משרד הביטחון*</b>
                <span>עד 90%</span>
              </div>
              <div className="tc-row tc-sub">
                <b>
                  MEU · מענק מתנה והוקרה <LexIcon name="gift" />
                </b>
                <span>10%</span>
              </div>
              <div className="tc-row tc-pay">
                <b>אתם משלמים</b>
                <span>0 ₪ · ללא עלות*</span>
              </div>
            </div>

            <div className="tribute-cta">
              <WaCta cta="eligibility" variant="primary" block />
              <p className="tribute-cta-note">
                בדיקה ראשונית בוואטסאפ, בלי התחייבות · מענה אישי בעברית.
              </p>
              {deepLink && (
                <p className="tribute-more">
                  <a href="/eligibility">כל הפרטים על הזכאות והמסלול המלא ←</a>
                </p>
              )}
            </div>
          </div>
        </div>

        <p className="tribute-disclaimer">
          *שיעור הסבסוד, גובה המענק ותנאי הזכאות נקבעים על ידי משרד הביטחון בלבד (אגף השיקום / אגף משפחות והנצחה), בכפוף לאישור עקרוני לזכאות לפני הרכישה. הציון &quot;עד 100%&quot; מבטא את הכיסוי המרבי האפשרי בלבד (סבסוד מוכר של עד 90% ממחיר הקלנועית, בתוספת מענק ההוקרה של MEU בשיעור 10%), ואינו מהווה התחייבות לזכאות, לשיעור הסבסוד או להיעדר עלות. מענק המתנה וההוקרה של MEU (10%) הוא הטבת רשות להשלמת העלות, בכפוף לאישור זכאות, למלאי ולתנאי המבצע, וניתן לשינוי או להפסקה בכל עת.
        </p>
      </div>
    </section>
  );
}
