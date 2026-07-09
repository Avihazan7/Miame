"use client";

// components/Product360Stage.tsx — a lightweight, premium dark product stage that
// PREPARES MIA FOUR for 360°/3D without shipping any heavy WebXR/Three.js. Phase 1
// (this): a static poster first, and a drag-to-rotate 360° image spin that lights
// up ONLY if the existing public.vehicle_media_assets row has spin360 frames.
//
// Fully graceful: lazy (IntersectionObserver — no fetch until near view), fails
// soft (any missing media / env / error just keeps the poster — never an error box
// or layout shift, since the frame is a fixed aspect-ratio). No schema change.

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { supabasePublicImageUrl, supabasePublicFileUrl } from "@/lib/vehicle-media";
import { trackVehicleMediaEvent } from "@/lib/trackVehicleMediaEvent";

// three.js lives behind this dynamic import — no SSR, and no bytes until the
// visitor actually opens the 3D view (Phase 2, gated on a real .glb).
const Product3DViewer = dynamic(() => import("./Product3DViewer"), {
  ssr: false,
  loading: () => <div className="p360-3d-loading">מכין תצוגת 3D…</div>,
});

function resolveFile(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  try {
    return supabasePublicFileUrl(path);
  } catch {
    return "";
  }
}

// Pure: which frame a horizontal drag of `deltaX` px lands on (wraps both ways).
// Extracted so the rotation math is unit-tested independently of the DOM.
export function spinIndex(startIndex: number, deltaX: number, frameCount: number): number {
  if (frameCount < 2) return 0;
  const next = Math.round(startIndex + deltaX / 9);
  return ((next % frameCount) + frameCount) % frameCount;
}

function resolveFrame(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  try {
    return supabasePublicImageUrl(path, { width: 1280 });
  } catch {
    return "";
  }
}

export default function Product360Stage({
  vehicleId,
  poster,
  alt = "MIA FOUR",
  glb,
}: {
  vehicleId: string;
  poster: string;
  alt?: string;
  glb?: string;
}) {
  const [frames, setFrames] = useState<string[]>([]);
  const [apiGlb, setApiGlb] = useState<string | null>(null);
  const [mode, setMode] = useState<"media" | "3d">("media");
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ startX: 0, startIndex: 0, active: false });
  const tracked = useRef(false);
  const model3dTracked = useRef(false);

  // A static prop wins; otherwise use a glb_path from vehicle_media_assets.
  const glbUrl = glb || apiGlb || "";

  // Lazy — start observing, and only fetch once the stage is near the viewport.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/vehicles/${encodeURIComponent(vehicleId)}/media`);
        if (!res.ok) return; // 404/503 → keep the poster, no error surfaced
        const json = await res.json();
        const paths: string[] = json?.media?.spin360Paths ?? [];
        const urls = paths.map(resolveFrame).filter(Boolean);
        if (!cancelled && urls.length > 1) setFrames(urls);
        const apiGlbUrl = resolveFile(json?.media?.glbPath ?? "");
        if (!cancelled && apiGlbUrl) setApiGlb(apiGlbUrl);
      } catch {
        // fail soft — the poster stays
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, vehicleId]);

  const hasSpin = frames.length > 1;

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!hasSpin) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { startX: e.clientX, startIndex: index, active: true };
      if (!tracked.current) {
        tracked.current = true;
        void trackVehicleMediaEvent({ vehicleId, type: "spin360_view", payload: { frames: frames.length } });
      }
    },
    [hasSpin, index, frames.length, vehicleId]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!drag.current.active || !hasSpin) return;
      setIndex(spinIndex(drag.current.startIndex, e.clientX - drag.current.startX, frames.length));
    },
    [hasSpin, frames.length]
  );

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    drag.current.active = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
  }, []);

  const src = hasSpin ? frames[index] : poster;
  const is3d = mode === "3d" && Boolean(glbUrl);
  const hasGlb = Boolean(glbUrl);

  function open3d() {
    setMode("3d");
    if (!model3dTracked.current) {
      model3dTracked.current = true;
      void trackVehicleMediaEvent({ vehicleId, type: "model3d_view" });
    }
  }

  // Pointer-drag rotates the 360° spin only in media mode; in 3D mode OrbitControls
  // owns the gestures, so the stage's own drag handlers step aside.
  const spinnable = hasSpin && !is3d;

  return (
    <section className="p360" aria-label="תצוגת מוצר">
      <div className="p360-head">
        <span className="p360-kicker">MiaMe · Product Stage</span>
      </div>
      <div
        ref={stageRef}
        className={`p360-stage product-stage-dark${spinnable ? " p360-live" : ""}`}
        onPointerDown={spinnable ? onPointerDown : undefined}
        onPointerMove={spinnable ? onPointerMove : undefined}
        onPointerUp={spinnable ? onPointerUp : undefined}
        onPointerCancel={spinnable ? onPointerUp : undefined}
      >
        {is3d ? (
          <div className="p360-3d">
            <Product3DViewer glbUrl={glbUrl} title={`${alt} · 3D`} />
          </div>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="p360-img" src={src} alt={alt} draggable={false} loading="lazy" />
            {hasSpin && (
              <div className="p360-hint" aria-hidden="true">
                גרור לסיבוב 360° · {index + 1}/{frames.length}
              </div>
            )}
          </>
        )}

        {hasGlb && (
          <div className="p360-controls">
            {is3d ? (
              <button type="button" className="p360-btn" onClick={() => setMode("media")}>
                חזרה לתמונה
              </button>
            ) : (
              <button type="button" className="p360-btn p360-btn-3d" onClick={open3d}>
                תצוגת 3D
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
