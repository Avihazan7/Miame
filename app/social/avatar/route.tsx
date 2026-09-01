// app/social/avatar/route.tsx — the profile picture, generated from the brand source.
//
// 1080×1080. One square serves all three networks: Facebook, Instagram and TikTok all
// crop a profile picture to a CIRCLE, so the artwork is centred and the corners are
// left empty on purpose — anything placed there is cut off on every platform.
//
// Generated rather than committed as a file so it can never drift from the palette in
// lib/og-brand.tsx, and so a re-render is a redeploy rather than a design request.
import { ImageResponse } from "next/og";
import { BRAND, Monogram } from "@/lib/og-brand";

// Local, not exported: a Route Handler accepts only GET/POST/runtime/… as
// exports, and `size`/`contentType` are the opengraph-image convention —
// exporting them here fails the build. ImageResponse sets the content type.
const size = { width: 1080, height: 1080 };

export function GET() {
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
          background: BRAND.gradient,
          color: BRAND.white,
          fontFamily: "sans-serif",
        }}
      >
        <Monogram size={430} />
        <div style={{ marginTop: 54, fontSize: 128, fontWeight: 900, letterSpacing: -3 }}>MiaMe</div>
      </div>
    ),
    { ...size },
  );
}
