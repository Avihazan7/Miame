"use client";

// components/Product3DViewer.tsx — the MIA FOUR GLB viewer, dark-premium to sit
// INSIDE the Product360Stage (transparent canvas over the navy stage). This module
// is only ever reached through a dynamic import (ssr:false) triggered by a user
// click, so three.js / @react-three never enter the initial page bundle.
//
// frameloop="demand" keeps it idle until the user interacts (no constant GPU spin
// beyond the gentle auto-rotate) — light on battery and mobile.

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, ContactShadows, Html, OrbitControls, useGLTF } from "@react-three/drei";

function Model({ url }: { url: string }) {
  const gltf = useGLTF(url) as { scene: object };
  return (
    <Bounds fit clip observe margin={1.2}>
      <primitive object={gltf.scene} rotation={[0, Math.PI * 0.08, 0]} />
    </Bounds>
  );
}

function Loader() {
  return (
    <Html center>
      <div className="p3d-loader">טוען מודל 3D…</div>
    </Html>
  );
}

export default function Product3DViewer({ glbUrl, title = "MIA FOUR · 3D" }: { glbUrl: string; title?: string }) {
  return (
    <Canvas
      frameloop="demand"
      // MEASURED 2026-09-01 in headless Chromium on this scene: at deviceScaleFactor 2
      // the 1.75 cap rendered a 1802px buffer into a 1030px canvas the display wanted
      // at 2060px, and at 3 it rendered the same 1802px against a wanted 3090px — 58%
      // of the panel's linear resolution, which is exactly the softness a dense screen
      // shows. The cap exists to bound fill rate, but this scene does not need bounding:
      // the GLB is 2,508 drawn triangles across 7 untextured PBR materials (12.3 KB), so
      // fragment cost, not geometry, dominates, and a mostly-transparent canvas is cheap.
      // 2 buys native rendering on every Retina-class display; beyond that the limit is
      // the ASSET, not the canvas — see public/models/README.md.
      dpr={[1, 2]}
      camera={{ position: [4.5, 2.2, 5.5], fov: 38 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      aria-label={title}
      style={{ width: "100%", height: "100%" }}
    >
      {/* Self-contained lighting — no remote HDR/Environment fetch, so the viewer
          works under a strict CSP and offline. Hemisphere + key/fill keep the
          matte body readable without image-based reflections. */}
      <hemisphereLight args={["#dff6ef", "#0b1a2c", 1.15]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 4]} intensity={2.2} />
      <directionalLight position={[-5, 3, -4]} intensity={0.9} color="#79E8C5" />
      <Suspense fallback={<Loader />}>
        <Model url={glbUrl} />
        <ContactShadows position={[0, -1.05, 0]} opacity={0.34} scale={12} blur={2.6} far={4} />
      </Suspense>
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={2.6}
        maxDistance={8.5}
        autoRotate
        autoRotateSpeed={0.35}
      />
    </Canvas>
  );
}
