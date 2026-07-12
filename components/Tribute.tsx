import { buildWhatsAppUrl } from "@/lib/whatsapp";
import LexIcon from "@/components/LexIcon";

export default function Tribute() {
  return (
    <section className="block tribute-sec" id="tribute">
      <div className="wrap">
        <div className="sec-head">
          <span className="tribute-flag">הוקרה והנגשה</span>
          <h2 className="sec-title" style={{ marginTop: "8px" }}>
            מיה פור מצדיעה לכוחות הביטחון
          </h2>
          <p className="sec-desc">ובני משפחותיהם · בכפוף לבדיקת זכאות במשרד הביטחון.</p>
        </div>
        <div className="tribute-wrap">
          <div className="tribute-media">
            <div className="tribute-badge">
              <span className="tb-pre">עד</span>
              100%<small>סבסוד*</small>
            </div>
            <img className="floaty" src="/mia-white.webp" alt="מיה פור · הקלנועית המלאה לכוחות הביטחון" loading="lazy" />
          </div>
          <div>
            <div className="elig-card">
              <div className="elig-head">
                <h3>נכי צה"ל וכוחות הביטחון</h3>
                <span className="elig-tag">אגף השיקום</span>
              </div>
              <p className="elig-body">
                קלנועית במימון משרד הביטחון, בהתאם לזכאות הרפואית והתפקודית · <b>עד 100% מוכר לסבסוד*</b>.
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
                <span className="elig-tag">אגף משפחות הנצחה</span>
              </div>
              <p className="elig-body">
                מענק לרכישת קלנועית יחיד, פעם ב־4 שנים · <b>עד 17,988 ₪</b> לאלמן/ה, <b>שהם עד 90% מוכרים לסבסוד*</b>.
              </p>
              <a
                className="elig-link"
                href="https://mishpahot-hantzaha.mod.gov.il/transportation/scooter"
                target="_blank"
                rel="noopener"
              >
                פרטי הזכאות באגף משפחות הנצחה ←
              </a>
            </div>
            <div className="tribute-calc">
              <div className="tc-head"><LexIcon name="gift" /> לזכאי כוחות הביטחון · מיה פור <bdi dir="ltr">2×4 City</bdi></div>
              <div className="tc-row">
                <b>מחיר מיה פור <bdi dir="ltr">2×4 City</bdi></b>
                <span>19,900 ₪</span>
              </div>
              <div className="tc-row tc-sub">
                <b>סבסוד מוכר · משרד הביטחון*</b>
                <span>עד 90%</span>
              </div>
              <div className="tc-row tc-sub">
                <b>MEU · מענק מתנה והוקרה <LexIcon name="gift" /></b>
                <span>10%</span>
              </div>
              <div className="tc-row tc-pay">
                <b>אתם משלמים</b>
                <span>0 ₪ · ללא עלות*</span>
              </div>
            </div>
            <div className="tribute-cta">
              <a
                className="btn btn-primary btn-block"
                href={buildWhatsAppUrl(
                  "היי, אשמח לבדוק זכאות לרכישת מיה פור דרך משרד הביטחון 🇮🇱"
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                בדיקת זכאות ורכישה דרך MiaMe
              </a>
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
