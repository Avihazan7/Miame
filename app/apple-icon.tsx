import { ImageResponse } from "next/og";

// Apple touch icon (raster required by iOS). Same identity as app/icon.svg:
// mint-cyan monogram on deep-navy, no gloss/glow — sharp on the home screen.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#081B33",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            fontSize: 128,
            fontWeight: 900,
            color: "#57E0B4",
            lineHeight: 1,
            letterSpacing: -4,
          }}
        >
          M
        </div>
      </div>
    ),
    { ...size }
  );
}
