"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Bounds,
  ContactShadows,
  Environment,
  Html,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";

type VehicleModelStageProps = {
  glbUrl: string;
  posterUrl?: string;
  title?: string;
  className?: string;
};

function VehicleModel({ url }: { url: string }) {
  const gltf = useGLTF(url) as any;

  return (
    <Bounds fit clip observe margin={1.25}>
      <primitive object={gltf.scene} rotation={[0, Math.PI * 0.08, 0]} />
    </Bounds>
  );
}

function Loader() {
  return (
    <Html center>
      <div className="rounded-full border border-cyan-200/70 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 shadow-xl backdrop-blur-xl">
        טוען מודל 3D…
      </div>
    </Html>
  );
}

export function VehicleModelStage({
  glbUrl,
  title = "Vehicle 3D model",
  className = "",
}: VehicleModelStageProps) {
  return (
    <div className={`relative h-[540px] min-h-[420px] overflow-hidden rounded-[2rem] border border-cyan-100 bg-[radial-gradient(circle_at_50%_10%,rgba(52,180,235,.18),transparent_34%),linear-gradient(180deg,#f8fdff,#eef8fb)] shadow-2xl ${className}`}>
      <div className="pointer-events-none absolute inset-x-8 top-6 z-10 flex items-center justify-between">
        <span className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-cyan-800 shadow-sm backdrop-blur-xl">
          Ultra 3D
        </span>
        <span className="rounded-full border border-cyan-100 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur-xl">
          Drag • Zoom • Rotate
        </span>
      </div>

      <Canvas
        frameloop="demand"
        dpr={[1, 1.75]}
        camera={{ position: [4.5, 2.2, 5.5], fov: 38 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        aria-label={title}
      >
        <ambientLight intensity={1.45} />
        <directionalLight position={[4, 5, 4]} intensity={2.2} />
        <Suspense fallback={<Loader />}>
          <VehicleModel url={glbUrl} />
          <Environment preset="city" />
          <ContactShadows
            position={[0, -1.05, 0]}
            opacity={0.32}
            scale={12}
            blur={2.6}
            far={4}
          />
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
    </div>
  );
}
