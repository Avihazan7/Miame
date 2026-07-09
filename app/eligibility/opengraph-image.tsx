import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/og";

export const alt = "MiaMe — defence-forces eligibility fit check";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    wordmark: "MiaMe",
    tagline: "ELIGIBILITY",
    sub: "Defence forces · tailored fit check",
  });
}
