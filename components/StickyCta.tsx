"use client";

// components/StickyCta.tsx — the mobile sticky bar.
//
// Same story as FloatingWa: a hand-rolled message and no analytics on one of the
// two CTAs that follow the visitor down every screen. Both now come from
// WA_CTA.hero, and the click is reported and campaign-tagged.

import { track } from "@/lib/analytics";
import { buildCampaignWhatsAppUrl } from "@/lib/whatsapp";
import { WA_CTA, waHref } from "@/lib/wa-cta";
import WaIcon from "./WaIcon";

export default function StickyCta() {
  return (
    <div className="sticky-cta">
      <a
        href={waHref("hero")}
        target="_blank"
        rel="noopener"
        className="sticky-wa"
        aria-label="דברו איתנו בוואטסאפ"
        data-wa="hero"
        onClick={(e) => {
          void track("WhatsAppClicked", { placement: "sticky-bar", intent: WA_CTA.hero.intent });
          // Server-rendered href → no campaign in it. Rebuild it on the click so
          // the message the rep opens names the campaign that paid for the lead.
          e.currentTarget.href = buildCampaignWhatsAppUrl(WA_CTA.hero.message);
        }}
      >
        <WaIcon size={24} />
      </a>
      <a href="#sim" className="btn btn-primary sticky-main">
        בדיקת התאמה
      </a>
    </div>
  );
}
