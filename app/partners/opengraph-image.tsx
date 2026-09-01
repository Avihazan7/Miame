import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og";

export const alt = "MiaMe Hub — open a rental/sales station";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    wordmark: "MiaMe Hub",
    // "PARTNER NETWORK" asserted a network on the card every partner link
    // previews with. MEASURED 2026-09-01: public.partners holds 0 rows. The card
    // now makes the ask it was always for.
    tagline: "BECOME A PARTNER",
    sub: "Open a rental / sales station",
  });
}
