"use client";

import { buildWhatsAppUrl } from "@/lib/whatsapp";
import WaIcon from "./WaIcon";
import MiaMark from "./MiaMark";

export default function Header() {
  const waUrl = buildWhatsAppUrl("היי MiaMe, אשמח לפרטים על הדגמים 🙂");

  function toTop(e: React.MouseEvent<HTMLAnchorElement>) {
    // Logo always goes home. If we're already on the home page, scroll to the
    // very top in place (no half-way landing, no #-anchor pull); otherwise let
    // the browser navigate to "/".
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
        <a className="brand" href="/" onClick={toTop} aria-label="MiaMe · Free Feel — דף הבית">
          <span className="brand-mark">
            <MiaMark size={38} title="MiaMe" />
          </span>
          <span className="brand-text">
            <span className="logo">
              Mia<span className="dot">Me</span>
            </span>
            <span className="brand-tag">
              <span aria-hidden="true">🗽</span> Free&nbsp;Feel
            </span>
          </span>
        </a>
        <nav className="nav-cta">
          <a href="/#features" className="nav-link hide-m">יכולות</a>
          <a href="/#models" className="nav-link hide-m">דגמים</a>
          <a href="/#sim" className="nav-link hide-m">סימולטור</a>
          <a href="/partners" className="nav-link hide-m">שותף עסקי</a>
          <a href={waUrl} target="_blank" rel="noopener" className="btn btn-wa btn-sm">
            <WaIcon size={18} />
            דברו איתי
          </a>
        </nav>
      </div>
    </header>
  );
}
