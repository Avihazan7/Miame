"use client";

// components/StickyCta.tsx — the mobile sticky bar.
//
// Same story as FloatingWa: a hand-rolled message and no analytics on one of the
// two CTAs that follow the visitor down every screen. Both now come from
// WA_CTA.hero, and the click is reported and campaign-tagged.

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { buildCampaignWhatsAppUrl } from "@/lib/whatsapp";
import { WA_CTA, waHref } from "@/lib/wa-cta";
import WaIcon from "./WaIcon";

export default function StickyCta() {
  // The bar and the Hero say the same two things, and the bar was saying them ON
  // TOP of the Hero. Measured 2026-09-08 at 390×844: the Hero's primary CTA sits
  // at y=785..837 and this bar covers 768..844 — the button the whole page is
  // built around was behind it at rest, from first paint, on every phone.
  //
  // So the bar waits its turn. While the Hero's own actions are on screen the
  // visitor already has both CTAs; the bar takes over only once they leave.
  // Hidden is the honest first state — it is what scroll 0 looks like — and a
  // page without a Hero (or a browser that never runs this effect and so never
  // hydrates) still shows it, because the fallback below opens the bar.
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const heroCta = document.getElementById("hero-cta");
    if (!heroCta || typeof IntersectionObserver !== "function") {
      setHidden(false);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setHidden(entry.isIntersecting));
    io.observe(heroCta);
    return () => io.disconnect();
  }, []);

  return (
    <div className="sticky-cta" data-hidden={hidden ? "true" : undefined}>
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
