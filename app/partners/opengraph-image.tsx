import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og";

export const alt = "MiaMe Hub — open a rental/sales station";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    wordmark: "MiaMe Hub",
    tagline: "PARTNER NETWORK",
    sub: "Open a rental / sales station",
  });
}
