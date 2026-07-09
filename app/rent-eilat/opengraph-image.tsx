import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og";

export const alt = "MiaMe · Eilat — hourly rental at Green Extreme";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    wordmark: "MiaMe · Eilat",
    tagline: "HOURLY RENTAL",
    sub: "Green Extreme · Terminal Park",
  });
}
