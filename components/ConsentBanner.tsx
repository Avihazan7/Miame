"use client";

// components/ConsentBanner.tsx — minimal, accessible (RTL, keyboard, focusable)
// cookie-consent banner. Renders ONLY when a marketing pixel is configured AND
// the visitor hasn't chosen yet, so the default deployment shows nothing.

import { useEffect, useState } from "react";
import { marketingEnabled, readConsent, setConsent } from "@/lib/marketing";
import Link from "next/link";

export default function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (marketingEnabled && readConsent() === null) setShow(true);
  }, []);

  if (!show) return null;

  function choose(state: "granted" | "denied") {
    setConsent(state);
    setShow(false);
  }

  return (
    <div
      className="consent"
      role="dialog"
      aria-live="polite"
      aria-label="הודעת עוגיות ופרטיות"
    >
      <p className="consent-text">
        אנחנו משתמשים בעוגיות למדידת ביצועים ולשיפור החוויה. בבחירת "מאשר/ת" תתאפשר
        מדידת פרסום ואנליטיקס. פרטים ב
        <Link href="/legal/privacy">מדיניות הפרטיות</Link>.
      </p>
      <div className="consent-actions">
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => choose("denied")}>
          רק הכרחי
        </button>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => choose("granted")}>
          מאשר/ת
        </button>
      </div>
    </div>
  );
}
