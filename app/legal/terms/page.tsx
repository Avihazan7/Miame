import type { Metadata } from "next";
import { MANUFACTURER_NAME_HE, DELIVERY_INCLUDED_NOTE } from "@/lib/content";
// Seller identification has to name a channel that answers, so the number is
// read from the one sales-line constant rather than typed here a second time.
import { SALES_PHONE_DISPLAY, SALES_PHONE_TEL } from "@/lib/whatsapp";
import Link from "next/link";
import { OG_BASE } from "@/lib/seo/og";

const UPDATED = "10 בספטמבר 2026";

const DESC =
  "תקנון האתר ותנאי הרכישה, המקדמות, הביטולים, המסירה, האחריות והשירות של MiaMe. הצעות התשלום באתר הן הערכה ואינן מחייבות.";

export const metadata: Metadata = {
  title: "תקנון ותנאי שימוש",
  description: DESC,
  alternates: { canonical: "/legal/terms" },
  openGraph: { ...OG_BASE, title: "תקנון ותנאי שימוש · MiaMe", description: DESC, url: "/legal/terms", type: "article" },
  robots: { index: true, follow: true }
};

export default function TermsPage() {
  return (
    <main id="main" className="legal">
      <Link href="/" className="legal-back">← חזרה לדף הבית</Link>
      <h1>תקנון ותנאי שימוש</h1>
      <p className="legal-meta">גרסה 1.1 · עודכן: {UPDATED}</p>

      <p>
        {/* "ההשכרה" stood here until 2026-09-10. MiaMe does not rent: the owner
            settled rental out of the business on 2026-09-02 (supabase/phases.json,
            9-rental-fleet-os), middleware.ts answers /rent-eilat with 410, and
            public/llms.txt tells answer engines, in as many words, "MiaMe אינה
            משכירה". This is the binding document, so it was the one place the claim
            could do real damage — the site told machines it does not rent while its
            own terms declared their scope over "ההשכרה … של מוצרי מיה דיינמיקס".
            The existing gate whitelisted this file by name, on the reasoning that
            rental "is legitimate in app/legal/terms"; that reasoning predates the
            owner's decision and is corrected in test/commercialTruth.test.ts. */}
        תקנון זה חל על השימוש באתר MiaMe.co.il (להלן: "האתר") ועל תהליך הרכישה
        והשירות של מוצרי {MANUFACTURER_NAME_HE} הנמכרים בו. האתר מופעל על ידי
        Leasing.co.il. עצם
        השימוש באתר, שליחת פנייה או ביצוע הזמנה מהווים הסכמה לתנאים אלה. אם אינך
        מסכים לתנאים, אין לעשות שימוש באתר.
      </p>

      <h2>1. המוצר והמידע באתר</h2>
      <p>
        המפרטים, התמונות, נתוני הטווח, הסוללה והביצועים המוצגים באתר מבוססים על
        נתוני היצרן/היבואן ומובאים לצורך התרשמות ראשונית בלבד. ייתכנו שינויים,
        טעויות סופר או עדכוני מפרט. המפרט הסופי, הזמינות והתנאים המחייבים ייקבעו
        במעמד ההתקשרות בכתב.
      </p>

      <h2>2. מחירים והצעות תשלום</h2>
      <ul>
        <li>המחירים נקובים בשקלים חדשים וכוללים מע"מ, אלא אם צוין אחרת.</li>
        <li>
          הצעת התשלום החודשית המחושבת בסימולטור היא הערכה ראשונית בלבד, אינה הצעה
          מחייבת ואינה מהווה אישור מימון. התשלום החודשי המשוער מחושב כיתרה לאחר
          מקדמה, מחולקת למספר התשלומים שנבחר, ללא ריבית והצמדה, בכפוף לאישור עסקה.
        </li>
        <li>
          העמדת מימון והתנאים בפועל כפופים לאישור פרטני, לבדיקת נתונים ולחתימה על
          הסכם.
        </li>
      </ul>

      <h2>3. הזמנה ומקדמה</h2>
      <p>
        הזמנת דגם עשויה להתבצע באמצעות פנייה (וואטסאפ/טופס) ובאישור נציג. ככל
        שתידרש מקדמה לשריון דגם או להתנעת הזמנה, פרטיה, סכומה ותנאיה יימסרו מראש.
        המקדמה נזקפת על חשבון התמורה הכוללת בכפוף להשלמת העסקה. אנו איננו שומרים
        פרטי כרטיס אשראי בשרתי האתר; סליקה, ככל שתתבצע, נעשית דרך ספק סליקה מאובטח.
      </p>

      <h2>4. ביטול עסקה</h2>
      <p>
        ביטול עסקה יתבצע בהתאם להוראות חוק הגנת הצרכן, התשמ"א-1981, ותקנותיו,
        לרבות זכות הביטול והחזר בניכוי דמי ביטול כמותר בדין. פנייה לביטול תופנה
        לפרטי הקשר שבתחתית עמוד זה.
      </p>

      <h2>5. מסירה ואספקה</h2>
      <p>
        {/* THE COST HALF, ADDED 2026-09-10 BY OWNER DECISION. Until then this clause
            covered delivery TIMING only, while components/Features.tsx told the buyer
            "משלוח … עלינו" — an absolute cost promise the binding document did not
            back by a single word. A promise the terms cannot answer for is the one a
            buyer complains about. The sentence is rendered from DELIVERY_INCLUDED_NOTE
            in lib/content.ts, the same constant the delivery section and the Offer's
            shippingDetails read, so the page and the contract cannot drift apart. */}
        {DELIVERY_INCLUDED_NOTE}. מועדי אספקה ומסירה הם הערכה וכפופים לזמינות מלאי.
        תיאום מסירה, נסיעת מבחן ומקום איסוף יבוצעו מול נציג. באחריות הרוכש לוודא
        התאמת המוצר לצרכיו ולדין החל על השימוש בו.
      </p>

      <h2>6. אחריות ושירות</h2>
      <p>
        תנאי האחריות, היקפה ותקופתה יימסרו במעמד הרכישה וכפופים לתנאי היצרן/היבואן
        ולשימוש תקין במוצר. שירות ותחזוקה יינתנו בהתאם למדיניות השירות המעודכנת.
      </p>

      <h2>7. הגבלת אחריות</h2>
      <p>
        המידע באתר ניתן כמות שהוא ("AS IS"). בכפוף לכל דין, MiaMe ו-Leasing.co.il
        לא יישאו באחריות לנזק עקיף, תוצאתי או מיוחד הנובע מהסתמכות על מידע שיווקי
        באתר. השימוש במוצר כפוף לחוקי התעבורה ולהוראות הבטיחות הרלוונטיות.
      </p>

      <h2>8. קניין רוחני</h2>
      <p>
        כל הזכויות באתר, בעיצובו, בתכניו, בסימני המסחר ובתמונות שמורות ל-Leasing.co.il
        או לבעלי הזכויות מטעמו. אין להעתיק, לשכפל או לעשות שימוש מסחרי ללא אישור
        בכתב.
      </p>

      <h2>9. פרטיות</h2>
      <p>
        עיבוד המידע האישי נעשה בהתאם ל<Link href="/legal/privacy">מדיניות הפרטיות</Link>
        {" "}של האתר, המהווה חלק בלתי נפרד מתקנון זה.
      </p>

      <h2>10. דין וסמכות שיפוט</h2>
      <p>
        על תקנון זה יחולו דיני מדינת ישראל. סמכות השיפוט הבלעדית נתונה לבתי המשפט
        המוסמכים במחוז תל אביב.
      </p>

      <div className="legal-note">
        כל הנתונים המספריים באתר (מחיר, טווח, מימון, אספקה) כפופים לתנאי עסקה,
        אישור ספק וזמינות מלאי, ואינם מהווים הבטחה מוחלטת.
      </div>

      <h2>יצירת קשר</h2>
      <p>
        {/* Address removed 2026-08-31 — the store has closed. Seller identification
            is kept through the trading name and a channel that actually answers. */}
        MiaMe (מבית Leasing.co.il) · טלפון:{" "}
        <a href={SALES_PHONE_TEL}>{SALES_PHONE_DISPLAY}</a>
      </p>
    </main>
  );
}
