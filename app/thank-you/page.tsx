// app/thank-you/page.tsx — the lead-success destination (task-pack: עמוד תודה).
//
// The Configurator navigates here after a successful lead submit (the WhatsApp
// tab opens separately), so ad platforms get a real, dedicated confirmation URL
// instead of an inline state. noindex — a thank-you page is never a SERP result.
import type { Metadata } from "next";
import Link from "next/link";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import WaIcon from "@/components/WaIcon";
import LexIcon from "@/components/LexIcon";

export const metadata: Metadata = {
  title: "תודה! הפרטים התקבלו",
  description: "הפנייה שלך התקבלה. נחזור אליך בהקדם עם ההצעה המותאמת.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/thank-you" },
};

const NEXT_STEPS = [
  { n: "1", t: "קיבלנו את הפרטים", d: "ההצעה שבנית נשמרה אצלנו." },
  { n: "2", t: "נציג יחזור אליך", d: "בטלפון או בוואטסאפ, לתיאום ובדיקת התאמה." },
  { n: "3", t: "סוגרים את הפרטים", d: "מסלול, זמינות ומועד מסירה, בכפוף לאישור." },
];

export default function ThankYouPage() {
  const waUrl = buildWhatsAppUrl(
    "היי MiaMe, השארתי פרטים באתר ואשמח להמשיך את השיחה על ההצעה שבניתי 🦋"
  );

  return (
    <main id="main" className="block" style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
      <div className="wrap" style={{ textAlign: "center", maxWidth: 600, padding: "48px 20px" }}>
        <div aria-hidden="true" style={{ fontSize: 56, lineHeight: 1 }}><LexIcon name="check" /></div>
        <h1 className="sec-title" style={{ marginTop: 16 }}>תודה! הפרטים התקבלו</h1>
        <p className="sec-desc" style={{ marginTop: 12 }}>
          ההצעה שבנית נשלחה אלינו (ואם נפתח וואטסאפ, היא כבר אצלך בצ׳אט).
          נציג MiaMe יחזור אליך בהקדם כדי לסגור את הפרטים האחרונים.
        </p>

        <ol className="ty-steps" aria-label="מה קורה עכשיו">
          {NEXT_STEPS.map((s) => (
            <li className="ty-step" key={s.n}>
              <span className="ty-step-n" aria-hidden="true">{s.n}</span>
              <span className="ty-step-t">{s.t}</span>
              <span className="ty-step-d">{s.d}</span>
            </li>
          ))}
        </ol>

        <div style={{ marginTop: 28, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href={waUrl} target="_blank" rel="noopener" className="btn btn-wa">
            <WaIcon size={20} />
            להמשך שיחה בוואטסאפ
          </a>
          <Link href="/#models" className="btn btn-ghost">חזרה לדגמים</Link>
        </div>

        <p className="ty-note">
          המחירים, המלאי והתנאים כפופים לעדכון ולאישור החברה/היבואן. השימוש באתר אינו מהווה התחייבות
          לאישור מימון או זמינות מלאי.
        </p>
      </div>
    </main>
  );
}
