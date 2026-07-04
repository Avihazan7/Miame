"use client";

// components/seo/SeoCta.tsx — conversion CTA for the SEO landing pages. Opens the
// WhatsApp sales flow with live UTM attribution and tracks the click, and links
// to the homepage simulator so the visitor lands straight on the deal builder.

import Link from "next/link";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { track } from "@/lib/analytics";
import WaIcon from "@/components/WaIcon";

export default function SeoCta({ topic }: { topic: string }) {
  function openWa() {
    void track("WhatsAppClicked", { source: `seo:${topic}` });
    const msg = `שלום, הגעתי מעמוד "${topic}" באתר MiaMe ואשמח לפרטים על מיה פור, זמינות ומחיר.`;
    const url = buildWhatsAppUrl(msg);
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
