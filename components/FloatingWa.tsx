"use client";

// components/FloatingWa.tsx — the site-wide floating WhatsApp button.
//
// It used to hand-roll its own message and fire no analytics at all, which made
// the most-present CTA on the site the one entry point nobody could measure. It
// now reads WA_CTA.hero — the registry entry that already carried exactly this
// message (details + payment track) and had no consumer — so there is one place
// to edit the wording, and it reports itself like every other CTA.

import { track } from "@/lib/analytics";
import { buildCampaignWhatsAppUrl } from "@/lib/whatsapp";
import { WA_CTA, waHref } from "@/lib/wa-cta";
import WaIcon from "./WaIcon";

export default function FloatingWa() {
  return (
    <a
      href={waHref("hero")}
      target="_blank"
      rel="noopener"
      className="wa-float"
      aria-label="דברו איתנו בוואטסאפ"
      data-wa="hero"
      onClick={(e) => {
        void track("WhatsAppClicked", { placement: "floating", intent: WA_CTA.hero.intent });
        // The href above is server-rendered, so the campaign this visitor arrived
        // on — which exists only in this browser — is not in it. Swap it here,
        // before the browser follows the link, so the rep reading WhatsApp can
        // tell a paid lead from an organic one.
        e.currentTarget.href = buildCampaignWhatsAppUrl(WA_CTA.hero.message);
      }}
    >
      <WaIcon size={30} />
    </a>
  );
}
