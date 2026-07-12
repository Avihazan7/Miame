// app/not-found.tsx — branded 404 (task-pack: דף 404 מותאם).
import type { Metadata } from "next";
import Link from "next/link";
import LexIcon from "@/components/LexIcon";

export const metadata: Metadata = {
  title: "404, העמוד לא נמצא",
  robots: { index: false, follow: false },
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
