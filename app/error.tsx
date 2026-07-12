"use client";

// app/error.tsx — branded runtime-error boundary (task-pack: דף שגיאה).
// Client component by Next.js contract; shows a generic message (never the raw
// error — that stays in the console/server log) with a reset + home escape.
import { useEffect } from "react";
import LexIcon from "@/components/LexIcon";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[miame] page error:", error);
  }, [error]);

  return (
    <main id="main" className="block" style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
      <div className="wrap" style={{ textAlign: "center", maxWidth: 560, padding: "48px 20px" }}>
        <div aria-hidden="true" style={{ fontSize: 56, lineHeight: 1 }}><LexIcon name="bolt" /></div>
        <h1 className="sec-title" style={{ marginTop: 16 }}>משהו השתבש לרגע</h1>
        <p className="sec-desc" style={{ marginTop: 12 }}>
          קרתה תקלה זמנית בטעינת העמוד. אפשר לנסות שוב — או לחזור לעמוד הבית.
        </p>
        <div style={{ marginTop: 28, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button type="button" className="btn btn-primary" onClick={reset}>לנסות שוב</button>
          <Link href="/" className="btn btn-ghost">לעמוד הבית</Link>
        </div>
      </div>
    </main>
  );
}
