import { ImageResponse } from "next/og";

// Shared dark-luxury OpenGraph renderer — deep-navy anchor, mint-cyan monogram,
// Latin wordmark (Latin avoids Satori Hebrew-font gaps, same choice as the
// homepage card). One DNA across every route so share previews look identical.

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export function renderOgCard({
  wordmark,
  tagline,
  sub,
}: {
  wordmark: string;
  tagline: string;
  sub: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0E2747 0%, #04121F 60%, #05070D 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 132,
            height: 132,
            borderRadius: 34,
            background: "#04121F",
            border: "2px solid rgba(87,224,180,0.55)",
            color: "#57E0B4",
            fontSize: 92,
            fontWeight: 900,
            marginBottom: 34,
          }}
        >
          M
        </div>
        <div style={{ fontSize: 84, fontWeight: 900, letterSpacing: -2 }}>{wordmark}</div>
        <div
          style={{
            marginTop: 10,
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: 8,
            color: "#79E8C5",
          }}
        >
          {tagline}
        </div>
        <div style={{ marginTop: 26, fontSize: 26, color: "#B9C7DA" }}>{sub}</div>
      </div>
    ),
    { ...OG_SIZE }
  );
}

// ── the shared Open Graph IMAGE reference, for routes that override openGraph ──
//
// MEASURED 2026-09-09 on the built output: seven routes declared their own
// `openGraph` object and emitted ZERO `og:image` while still emitting
// `twitter:card=summary_large_image` — /legal/privacy, /legal/terms and
// /legal/accessibility (all `index: true`), plus /thank-you,
// /marketplace-preview, /eligibility and /link. A large-image card with no image
// is not a neutral fallback: X and most scrapers render an empty frame, so every
// share of the three indexed legal pages produced a blank card.
//
// The cause is Next's metadata merge, which replaces one TOP-LEVEL key at a time.
// A route that declares `openGraph: { title, description, url, type }` replaces
// the parent's WHOLE openGraph object and takes the inherited image with it. The
// trap is invisible in review, because the object you wrote looks complete.
//
// Spread OG_IMAGES into any route that overrides openGraph.
export const OG_IMAGES = [
  {
    url: "/opengraph-image",
    width: OG_SIZE.width,
    height: OG_SIZE.height,
    alt: "MiaMe · מיה פור, קלנועית חשמלית על 4 גלגלים",
  },
];
