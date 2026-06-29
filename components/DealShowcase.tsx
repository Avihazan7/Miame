"use client";

// components/DealShowcase.tsx — the 3D "Deal Aura" showcase.
//
// Instrumental enrichment for the U.M.M blind auction: the vehicle rendered in a
// clean studio scene whose ATMOSPHERE reflects the deal's standing. The brighter
// the azure aura behind the car, the closer the supplier's offer sits to the Big
// Five Nash equilibrium — so the customer FEELS the better deal before reading a
// single number.
//
// Two render modes:
//   • billboard (imageUrl) — textures an existing 2D vehicle cutout onto a plane
//     inside the WebGL scene. Self-contained: no external model/HDR, offline-safe.
//   • model (modelUrl) — a true GLTF/GLB model, for when a 3D asset exists.
//
// Architecture invariant (enforced by ulease-core + the guardians): the score is
// SEALED server-side. This component only MAPS an already-computed score to
// light; it must never re-derive or re-weight scoring on the client. `score`
// always arrives from app/api/deal (the brain), never from browser state.

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useTexture, Environment, ContactShadows, Float } from "@react-three/drei";
import { motion } from "framer-motion";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/** Score at/above which a deal earns the premium "perfect equilibrium" badge. */
const AZURE_THRESHOLD = 90;
const AZURE = "#0ea5e9";
const NEUTRAL = "#e2e8f0";

/** Continuous 0→1 ramp: a 50 is dim, a ~95 is fully lit. Calm, analog feedback. */
function auraStrength(score: number): number {
  return Math.max(0, Math.min(1, (score - 50) / 45));
}

/** A soft radial gradient texture, built once on the client (no network). */
function useRadialTexture(): THREE.Texture | null {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.45, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

// Game-theory layer: the azure glow behind the car, brightening with the sealed
// score. A winning offer bathes the vehicle in deep תכלת; a weak one stays faint.
function DealAura({ score, radial }: { score: number; radial: THREE.Texture | null }) {
  const ref = useRef<THREE.Mesh>(null);
  const strength = auraStrength(score);
  const color = strength > 0.85 ? AZURE : strength > 0.2 ? AZURE : NEUTRAL;

  // Gentle breathing so the aura feels alive, scaled by how strong the deal is.
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 1.1) * 0.04 * strength;
    const base = 5.5 + strength * 2.5;
    ref.current.scale.set(base * pulse, base * pulse, 1);
  });

  if (!radial) return null;
  return (
    <mesh ref={ref} position={[0, 0.1, -1.6]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={radial}
        color={color}
        transparent
        opacity={0.15 + strength * 0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

// A soft contact shadow ellipse grounding the billboard (no network HDR needed).
function GroundShadow({ radial }: { radial: THREE.Texture | null }) {
  if (!radial) return null;
  return (
    <mesh position={[0, -1.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[3.4, 2.2]} />
      <meshBasicMaterial map={radial} color="#0b1220" transparent opacity={0.32} depthWrite={false} />
    </mesh>
  );
}

// billboard: the existing 2D vehicle cutout, kept crisp/true-color (unlit) so the
// aura reads as light BEHIND it rather than tinting the car itself.
function DealBillboard({ imageUrl }: { imageUrl: string }) {
  const texture = useTexture(imageUrl);
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
  }, [texture]);

  const aspect = useMemo(() => {
    const img = texture.image as { width?: number; height?: number } | undefined;
    return img?.width && img?.height ? img.width / img.height : 1;
  }, [texture]);

  const height = 2.6;
  return (
    <Float speed={1.4} rotationIntensity={0.12} floatIntensity={0.4}>
      <mesh>
        <planeGeometry args={[height * aspect, height]} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} alphaTest={0.02} />
      </mesh>
    </Float>
  );
}

// model: a true GLTF/GLB scene, lit by the studio environment + the aura colour.
function DealModel({ modelUrl, score }: { modelUrl: string; score: number }) {
  const { scene } = useGLTF(modelUrl);
  const winning = score >= AZURE_THRESHOLD;
  const intensity = 0.5 + auraStrength(score);
  const auraColor = winning ? AZURE : NEUTRAL;
  return (
    <>
      <ambientLight intensity={intensity} color={auraColor} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
      <Environment preset="studio" />
      <ContactShadows position={[0, -1, 0]} opacity={0.7} scale={10} blur={2.5} color={auraColor} />
      <primitive object={scene} scale={1.2} />
    </>
  );
}

export type DealShowcaseProps = {
  /** The SEALED deal score from app/api/deal (0–100). Never computed client-side. */
  score: number;
  /** URL of a GLTF/GLB model to render (true-3D mode). */
  modelUrl?: string;
  /** URL of a 2D vehicle cutout to render as a billboard (used when no model exists). */
  imageUrl?: string;
  /** Optional sealed grade label from the brain, shown alongside the score. */
  grade?: string;
  /** Optional height override for the canvas container. */
  className?: string;
};

export default function DealShowcase({ score, modelUrl, imageUrl, grade, className }: DealShowcaseProps) {
  // Gate WebGL behind mount so it never runs during SSR (document/canvas access).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const radial = useRadialTexture();
  const winning = score >= AZURE_THRESHOLD;

  return (
    <div
      className={
        className ??
        "w-full h-[600px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative"
      }
    >
      {/* Deal-transparency label — instrumental enrichment, only for winning offers. */}
      {winning && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute top-6 right-6 z-10 bg-[#0ea5e9]/10 text-[#0ea5e9] px-4 py-2 rounded-full font-medium text-sm backdrop-blur-md"
        >
          Deal Score: {score}
          {grade ? ` · ${grade}` : ""} — 🎯 שיווי משקל מושלם
        </motion.div>
      )}

      {mounted && (modelUrl || imageUrl) && (
        <Canvas
          camera={{ position: [0, 0, 5], fov: 42 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.6} />
          <DealAura score={score} radial={radial} />
          <GroundShadow radial={radial} />
          <Suspense fallback={null}>
            {imageUrl ? (
              <DealBillboard imageUrl={imageUrl} />
            ) : modelUrl ? (
              <DealModel modelUrl={modelUrl} score={score} />
            ) : null}
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}

// Preload helper for callers that know the model URL ahead of render.
export const preloadDealModel = (modelUrl: string) => useGLTF.preload(modelUrl);
