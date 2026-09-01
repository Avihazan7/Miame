// app/social/cover/route.tsx — the Facebook page cover, generated from the brand source.
//
// 1640×856 — Facebook's upload size for a page cover. It is displayed at 820×312 on
// desktop and cropped HARDER on mobile, which is the whole reason this layout keeps
// every element inside the middle band and leaves the outer thirds empty: text placed
// where it looks balanced in the full 1640×856 is text a phone cuts off.
//
// Facebook is the only one of the three that HAS a cover. Instagram and TikTok have
// none, so none is generated — inventing an asset a platform does not accept is how a
// launch kit ends up with files nobody can use. The avatar at /social/avatar serves
// all three.
import { ImageResponse } from "next/og";
import { BRAND, Monogram } from "@/lib/og-brand";

// Local, not exported: a Route Handler accepts only GET/POST/runtime/… as
// exports, and `size`/`contentType` are the opengraph-image convention —
// exporting them here fails the build. ImageResponse sets the content type.
const size = { width: 1640, height: 856 };

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND.gradient,
          color: BRAND.white,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 56 }}>
          <Monogram size={230} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 132, fontWeight: 900, letterSpacing: -4, lineHeight: 1 }}>MiaMe</div>
            <div
              style={{
                marginTop: 18,
                fontSize: 44,
                fontWeight: 700,
                letterSpacing: 10,
                color: BRAND.mintSoft,
              }}
            >
              FREE FEEL · MIA FOUR
            </div>
            <div style={{ marginTop: 20, fontSize: 34, color: BRAND.mist }}>
              Premium electric mobility · miame.co.il
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
