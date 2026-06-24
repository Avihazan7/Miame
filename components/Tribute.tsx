import { buildWhatsAppUrl } from "@/lib/whatsapp";

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
              95%<small>מימון*</small>
            </div>
            <img className="floaty" src="/miame-front.webp" alt="מיה פור · קלנועית יחיד" />
          </div>
          <div>
            <div className="elig-card">
              <div className="elig-head">
                <h3>נכי צה"ל וכוחות הביטחון</h3>
                <span className="elig-tag">אגף השיקום</span>
              </div>
              <p className="elig-body">
                קלנועית במימון משרד הביטחון, בהתאם לזכאות הרפואית והתפקודית · <b>עד 95%*</b> מהעלות.
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
                מענק לרכישת קלנועית יחיד, פעם ב־4 שנים · <b>עד 13,494 ₪</b> להורה שכול · <b>עד 17,988 ₪</b> לאלמן/ה.
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
              <div className="tc-head">🎁 לזכאי אגף השיקום · מיה פור 4×2</div>
              <div className="tc-row">
                <b>מחיר מיה פור 4×2</b>
                <span>19,900 ₪</span>
              </div>
              <div className="tc-row tc-sub">
                <b>מימון אגף השיקום*</b>
                <span>עד 95%</span>
              </div>
              <div className="tc-row tc-sub">
                <b>מענק מתנה MiaMe.co.il 🎁</b>
                <span>5%</span>
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
          *שיעור המימון, גובה המענק ותנאי הזכאות נקבעים על ידי משרד הביטחון בלבד (אגף השיקום / אגף משפחות הנצחה), בכפוף לאישור עקרוני לזכאות לפני הרכישה. אין באמור משום התחייבות לזכאות או לגובה המימון. מענק המתנה של MiaMe.co.il (5%) הוא הטבה לזכאי אגף השיקום בלבד, להשלמת העלות עד אפס, בכפוף לאישור זכאות ולתנאי המבצע.
        </p>
      </div>
    </section>
  );
}
