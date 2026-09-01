// lib/og-brand.tsx — the brand DNA shared by every generated image.
//
// One place, because these assets are seen SIDE BY SIDE: the share card in a feed,
// the avatar on the profile that posted it, the cover behind that avatar. A palette
// that drifts between them reads as two different companies, and it drifts the moment
// the hex codes are typed twice.
//
// ⚠️ LATIN ONLY, and it is not a style choice. Satori — the renderer behind
// `next/og` — has no Hebrew font in this build, so Hebrew glyphs come out as blank
// boxes. app/opengraph-image.tsx already carries that constraint; anything added here
// inherits it. Hebrew belongs in the PAGE, which has real fonts.

export const BRAND = {
  navy: "#0E2747",
  deep: "#04121F",
  ink: "#05070D",
  mint: "#57E0B4",
  mintSoft: "#79E8C5",
  mist: "#B9C7DA",
  white: "#ffffff",
  /** The gradient every surface is anchored on. */
  gradient: "linear-gradient(135deg, #0E2747 0%, #04121F 60%, #05070D 100%)",
  ring: "rgba(87,224,180,0.55)",
} as const;

/** The monogram, sized to its surface. Square, rounded, mint on deep navy. */
export function Monogram({ size }: { size: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.26),
        background: BRAND.deep,
        border: `${Math.max(2, Math.round(size * 0.015))}px solid ${BRAND.ring}`,
        color: BRAND.mint,
        fontSize: Math.round(size * 0.7),
        fontWeight: 900,
      }}
    >
      M
    </div>
  );
}
