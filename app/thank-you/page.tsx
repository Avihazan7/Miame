// app/thank-you/page.tsx — the lead-success destination (task-pack: עמוד תודה).
//
// The Configurator navigates here after a successful lead submit (the WhatsApp
// tab opens separately), so ad platforms get a real, dedicated confirmation URL
// instead of an inline state. noindex — a thank-you page is never a SERP result.
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "תודה! הפרטים התקבלו — MiaMe",
  description: "הפנייה שלך התקבלה. נחזור אליך בהקדם עם ההצעה המותאמת.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/thank-you" },
};

export default function ThankYouPage() {
  return (
    <main id="main" className="block" style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
      <div className="wrap" style={{ textAlign: "center", maxWidth: 560, padding: "48px 20px" }}>
        <div aria-hidden="true" style={{ fontSize: 56, lineHeight: 1 }}>🎉</div>
        <h1 className="sec-title" style={{ marginTop: 16 }}>תודה! הפרטים התקבלו</h1>
        <p className="sec-desc" style={{ marginTop: 12 }}>
          ההצעה שבנית נשלחה אלינו (ואם נפתח וואטסאפ — היא כבר אצלך בצ׳אט).
          נציג MiaMe יחזור אליך בהקדם כדי לסגור את הפרטים האחרונים.
        </p>
        <div style={{ marginTop: 28, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/#models" className="btn btn-primary">חזרה לדגמים</Link>
          <Link href="/" className="btn btn-ghost">לעמוד הבית</Link>
        </div>
      </div>
    </main>
  );
}
