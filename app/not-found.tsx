// app/not-found.tsx — branded 404 (task-pack: דף 404 מותאם).
import type { Metadata } from "next";
import Link from "next/link";
import LexIcon from "@/components/LexIcon";

export const metadata: Metadata = {
  title: "404, העמוד לא נמצא",
  robots: { index: false, follow: false },
  // canonical: null — NOT inherited. MEASURED on the built HTML 2026-09-09:
  // .next/server/app/_not-found.html carried
  // `<link rel="canonical" href="https://www.miame.co.il">`, because Next merges
  // `alternates` down from the root layout and app/layout.tsx declares
  // `alternates: { canonical: "/" }` for the homepage.
  //
  // So EVERY 404 on the domain — every typo, every dead inbound link, every
  // hallucinated URL an answer engine emits — declared the homepage as its
  // canonical. That is the site telling Google "this URL and the homepage are the
  // same page", which is an invitation to fold arbitrary junk URLs into the
  // homepage's cluster. It also pairs a canonical with `noindex` on one page, a
  // combination Google's own documentation calls contradictory: the canonical says
  // "index the target instead", the robots tag says "index nothing here", and which
  // one wins is not defined.
  //
  // A 404 has no canonical. `null` is how Next is told to emit none.
  alternates: { canonical: null },
};

export default function NotFound() {
  return (
    <main id="main" className="block" style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
      <div className="wrap" style={{ textAlign: "center", maxWidth: 560, padding: "48px 20px" }}>
        <div aria-hidden="true" style={{ fontSize: 56, lineHeight: 1 }}><LexIcon name="search" /></div>
        <h1 className="sec-title" style={{ marginTop: 16 }}>404, העמוד לא נמצא</h1>
        <p className="sec-desc" style={{ marginTop: 12 }}>
          הכתובת שהגעת אליה לא קיימת (או שזזה). הדגמים, הסימולטור וכל השאר, עדיין כאן.
        </p>
        <div style={{ marginTop: 28, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" className="btn btn-primary">לעמוד הבית</Link>
          <Link href="/#sim" className="btn btn-ghost">לסימולטור התשלומים</Link>
        </div>
      </div>
    </main>
  );
}
