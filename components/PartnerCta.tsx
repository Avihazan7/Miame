"use client";

// components/PartnerCta.tsx — the B2B / MiaMe Hub WhatsApp CTA. Client-side so the
// message carries the live UTM attribution and the interest is tracked (GA4 b2b
// generate_lead + Meta Lead + Supabase event) before opening WhatsApp.

import { buildWhatsAppUrl, buildPartnerMessage } from "@/lib/whatsapp";
import { track } from "@/lib/analytics";
import WaIcon from "./WaIcon";

export default function PartnerCta() {
  function open() {
    void track("PartnerInterest", { source: "partner_section" });
    const url = buildWhatsAppUrl(buildPartnerMessage("", "", ""));
    if (typeof window !== "undefined") window.open(url, "_blank", "noopener");
  }

  return (
    <button type="button" onClick={open} className="btn btn-wa btn-block">
      <WaIcon size={18} />
      אני רוצה להיות שותף עסקי
    </button>
  );
}
