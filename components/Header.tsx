"use client";

import LexIcon from "@/components/LexIcon";
import MiaMark from "./MiaMark";
import Link from "next/link";

export default function Header() {
  // OWNER DECISION 2026-09-09: the header's WhatsApp button ("דברו איתי") was
  // removed. The page now offers ONE call to action — "בדיקת התאמה" in the sticky
  // bar — instead of a WhatsApp button at the top, a second one in the bar and the
  // floating one in between. WA_CTA.models is consequently unused by this file;
  // it is still the registry entry other surfaces read, so it stays in lib/wa-cta.

  function toTop(e: React.MouseEvent<HTMLAnchorElement>) {
    // Logo always goes home. If we're already on the home page, scroll to the
    // very top in place (no half-way landing, no #-anchor pull); otherwise let
    // the router navigate to "/". This still holds now that the brand is a
    // <Link>: Link calls this handler FIRST and then returns early on
    // `e.defaultPrevented`, so preventDefault() suppresses the navigation
    // exactly as it suppressed the browser's.
    if (window.location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      if (window.location.hash) {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }
  }

  return (
    <header className="site-header" id="top">
      <div className="wrap nav">
        <Link className="brand" href="/" onClick={toTop} aria-label="MiaMe · Free Feel, דף הבית">
          <span className="brand-mark">
            <MiaMark size={38} title="MiaMe" />
          </span>
          <span className="brand-text">
            <span className="logo">
              Mia<span className="dot">Me</span>
            </span>
            <span className="brand-tag">
              <LexIcon name="butterfly" /> Free&nbsp;Feel
            </span>
          </span>
        </Link>
        <nav className="nav-cta">
          <Link href="/#features" className="nav-link hide-m">יכולות</Link>
          <Link href="/#models" className="nav-link hide-m">דגמים</Link>
          <Link href="/#sim" className="nav-link hide-m">סימולטור</Link>
        </nav>
      </div>
    </header>
  );
}
