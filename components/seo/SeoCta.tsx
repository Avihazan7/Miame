"use client";

// components/seo/SeoCta.tsx — conversion CTA for the SEO landing pages. Opens the
// WhatsApp sales flow and tracks the click, and links to the homepage simulator so
// the visitor lands straight on the deal builder.
//
// Two things this file used to get wrong, both invisible from the outside:
//   · The header above claimed "live UTM attribution". It did not have it —
//     buildWhatsAppUrl carries the message and nothing else — so the four organic
//     landing pages, the ones paid traffic actually lands on, were the only CTAs
//     sending the rep a message with no campaign in it. Exactly backwards.
//   · It reported `{ source: "seo:<topic>" }` while every other entry point reports
//     `{ placement, intent }`, so any funnel report grouping by placement dropped it
//     silently. `source` is kept beside them: whatever already reads it keeps working.
//
// Unlike the anchor-based CTAs this one is a BUTTON, so there is no server-rendered
// href for a middle-click or a copy-link to escape through — the campaign is on
// every path out of here.

import Link from "next/link";
import { buildCampaignWhatsAppUrl } from "@/lib/whatsapp";
import { track } from "@/lib/analytics";
import WaIcon from "@/components/WaIcon";

export default function SeoCta({ topic }: { topic: string }) {
  function openWa() {
    void track("WhatsAppClicked", { placement: "seo-landing", intent: "inquiry", source: `seo:${topic}` });
    const msg = `שלום, הגעתי מעמוד "${topic}" באתר MiaMe ואשמח לפרטים על מיה פור, זמינות ומחיר.`;
    const url = buildCampaignWhatsAppUrl(msg);
    if (typeof window !== "undefined") window.open(url, "_blank", "noopener");
  }

  return (
    <div className="seo-cta">
      <Link href="/#sim" className="btn btn-primary">
        בנה הצעת תשלום תוך דקה
      </Link>
      <button type="button" onClick={openWa} className="btn btn-wa">
        <WaIcon size={18} />
        דברו איתנו בוואטסאפ
      </button>
    </div>
  );
}
