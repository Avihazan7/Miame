// M31 — Spatial-ready hero slot. An INERT placeholder that reserves the layout for a
// future 3D/AR experience WITHOUT activating anything. No canvas, no WebGL, no Three.js,
// no ZeroLight, no iframe, no external asset, no network, no hidden live renderer — it is
// a static, layout-ready, aria-hidden decorative area only.

import { HERO_SLOT } from "@/lib/marketplace-preview";

export default function SpatialHeroSlot() {
  return (
    <div
      className="mp-hero-slot"
      data-future-3d-slot="true"
      aria-hidden="true"
      role="presentation"
    >
      <span className="mp-hero-caption">{HERO_SLOT.caption}</span>
    </div>
  );
}
