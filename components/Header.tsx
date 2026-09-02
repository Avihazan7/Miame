"use client";

import { track } from "@/lib/analytics";
import { buildCampaignWhatsAppUrl } from "@/lib/whatsapp";
import { WA_CTA, waHref } from "@/lib/wa-cta";
import LexIcon from "@/components/LexIcon";
import WaIcon from "./WaIcon";
import MiaMark from "./MiaMark";

export default function Header() {
  // The header used to hand-roll its own "פרטים על הדגמים" message while
  // WA_CTA.models — the registry entry that says the same thing — sat unused.
  // Two vocabularies for one funnel is precisely what the registry exists to
  // prevent, so the header reads from it and the entry is no longer dead.
  const waUrl = waHref("models");

  function onWaClick(e: React.MouseEvent<HTMLAnchorElement>) {
    void track("WhatsAppClicked", { placement: "header", intent: WA_CTA.models.intent });
    // waUrl is built while rendering — on the server too — so the campaign this
    // visitor arrived on, which lives only in this browser, cannot be inside it.
    // Rebuild the href here, before the browser follows the link, so a paid lead
    // is identifiable by the human reading WhatsApp.
    e.currentTarget.href = buildCampaignWhatsAppUrl(WA_CTA.models.message);
  }

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
        <a className="brand" href="/" onClick={toTop} aria-label="MiaMe · Free Feel, דף הבית">
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
        </a>
        <nav className="nav-cta">
          <a href="/#features" className="nav-link hide-m">יכולות</a>
          <a href="/#models" className="nav-link hide-m">דגמים</a>
          <a href="/#sim" className="nav-link hide-m">סימולטור</a>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener"
            className="btn btn-wa btn-sm"
            data-wa="models"
            onClick={onWaClick}
          >
            <WaIcon size={18} />
            דברו איתי
          </a>
        </nav>
      </div>
    </header>
  );
}
