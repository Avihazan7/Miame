import { ImageResponse } from "next/og";

// Dark luxury OpenGraph/share card — deep-navy anchor, mint-cyan monogram, Latin
// wordmark (Latin avoids Satori Hebrew-font gaps). Same DNA as the search mark.
export const alt = "MiaMe — Free Feel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
          background:
            "linear-gradient(135deg, #0E2747 0%, #081B33 60%, #05070D 100%)",
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
            background: "#081B33",
            border: "2px solid rgba(87,224,180,0.55)",
            color: "#57E0B4",
            fontSize: 92,
            fontWeight: 900,
            marginBottom: 34,
          }}
        >
          M
        </div>
        <div style={{ fontSize: 84, fontWeight: 900, letterSpacing: -2 }}>MiaMe</div>
        <div
          style={{
            marginTop: 10,
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: 8,
            color: "#79E8C5",
          }}
        >
          FREE FEEL · MIA FOUR
        </div>
        <div style={{ marginTop: 26, fontSize: 26, color: "#B9C7DA" }}>
          Premium electric mobility
        </div>
      </div>
    ),
    { ...size }
  );
}
