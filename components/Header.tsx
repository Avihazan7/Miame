"use client";

import { buildWhatsAppUrl } from "@/lib/whatsapp";
import WaIcon from "./WaIcon";
import MiaMark from "./MiaMark";

export default function Header() {
  const waUrl = buildWhatsAppUrl("היי MiaMe, אשמח לפרטים על הדגמים 🙂");

  function toTop(e: React.MouseEvent<HTMLAnchorElement>) {
    // Always return to the very top — no half-way landing, no #-anchor pull.
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  return (
    <header className="site-header" id="top">
      <div className="wrap nav">
        <a className="brand" href="#top" onClick={toTop} aria-label="MiaMe · Free Feel">
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
          <a href="#features" className="nav-link hide-m">יכולות</a>
          <a href="#models" className="nav-link hide-m">דגמים</a>
          <a href="#sim" className="nav-link hide-m">סימולטור</a>
          <a href="#partner" className="nav-link hide-m">שותף עסקי</a>
          <a href={waUrl} target="_blank" rel="noopener" className="btn btn-wa btn-sm">
            <WaIcon size={18} />
            דברו איתי
          </a>
        </nav>
      </div>
    </header>
  );
}
