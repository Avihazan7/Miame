"use client";

// components/DealShowcase.tsx — the 3D "Deal Aura" showcase.
//
// Instrumental enrichment for the U.M.M blind auction: a model of the vehicle
// rendered in 8K-clean studio light whose ATMOSPHERE reflects the deal's
// standing. The brighter the azure aura, the closer the supplier's offer sits to
// the Big Five Nash equilibrium — so the customer FEELS the better deal before
// reading a single number.
//
// Architecture invariant (enforced by ulease-core + the guardians): the score is
// SEALED server-side. This component only MAPS an already-computed score to
// light; it must never re-derive or re-weight scoring on the client. `score`
// always arrives from app/api/deal (the brain), never from browser state.

import { Canvas } from "@react-three/fiber";
import { useGLTF, Environment, ContactShadows } from "@react-three/drei";
import { motion } from "framer-motion";

/** Score at/above which a deal earns the premium azure aura (display threshold). */
const AZURE_THRESHOLD = 90;

type DealAuraProps = { score: number };

// Game-theory layer: map the sealed deal score to atmosphere. A winning offer
// (Big Five satisfied) bathes the car in deep, glowing תכלת; everything else
// stays in neutral light.
function UMMDealAura({ score }: DealAuraProps) {
  const winning = score >= AZURE_THRESHOLD;
  const auraColor = winning ? "#0ea5e9" : "#e2e8f0"; // Azure vs Neutral Light
  const intensity = winning ? 1.5 : 0.5;

  return (
    <>
      <ambientLight intensity={intensity} color={auraColor} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
      <Environment preset="studio" />
      <ContactShadows position={[0, -1, 0]} opacity={0.7} scale={10} blur={2.5} color={auraColor} />
    </>
  );
}

type DealModelProps = { modelUrl: string };

function DealModel({ modelUrl }: DealModelProps) {
  const { scene } = useGLTF(modelUrl);
  return <primitive object={scene} scale={1.2} />;
}

export type DealShowcaseProps = {
  /** URL of the GLTF/GLB vehicle model to render. */
  modelUrl: string;
  /** The SEALED deal score from app/api/deal (0–100). Never computed client-side. */
  score: number;
  /** Optional sealed grade label from the brain, shown alongside the score. */
  grade?: string;
};

export default function DealShowcase({ modelUrl, score, grade }: DealShowcaseProps) {
  const winning = score >= AZURE_THRESHOLD;

  return (
    <div className="w-full h-[600px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
      {/* Deal-transparency label — instrumental enrichment, shown only for winning offers. */}
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

      <Canvas camera={{ position: [4, 2, 5], fov: 45 }}>
        <UMMDealAura score={score} />
        <DealModel modelUrl={modelUrl} />
      </Canvas>
    </div>
  );
}

// Preload helper for callers that know the model URL ahead of render.
export const preloadDealModel = (modelUrl: string) => useGLTF.preload(modelUrl);
