"use client";

import Image from "next/image";
import { KeyboardEvent, PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

const FRAMES = [
  "/360/mia-four-360-01.webp",
  "/360/mia-four-360-02.webp",
  "/360/mia-four-360-03.webp",
  "/360/mia-four-360-04.webp",
  "/360/mia-four-360-05.webp",
  "/360/mia-four-360-06.webp",
] as const;

const DRAG_PX_PER_FRAME = 42;

export default function HeroTurntable() {
  const [frame, setFrame] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartFrame = useRef(0);

  const announce = useMemo(() => `זווית ${frame + 1} מתוך ${FRAMES.length}`, [frame]);

  useEffect(() => {
    for (const src of FRAMES.slice(1)) {
      const img = new window.Image();
      img.decoding = "async";
      img.src = src;
    }
  }, []);

  const normalize = useCallback((value: number) => {
    const n = FRAMES.length;
    return ((value % n) + n) % n;
  }, []);

  const step = useCallback((delta: number) => {
    setFrame((current) => normalize(current + delta));
  }, [normalize]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    dragStartX.current = event.clientX;
    dragStartFrame.current = frame;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const dx = event.clientX - dragStartX.current;
    const offset = Math.round(dx / DRAG_PX_PER_FRAME);
    setFrame(normalize(dragStartFrame.current - offset));
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    } else if (event.key === "Home") {
      event.preventDefault();
      setFrame(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setFrame(FRAMES.length - 1);
    }
  };

  return (
    <div
      className={`hero-360${dragging ? " is-dragging" : ""}`}
      role="group"
      aria-roledescription="תצוגת 360 מעלות"
      aria-label="MIA FOUR, שש זוויות צילום. גררו, החליקו או השתמשו בחיצים."
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
    >
      <div className="hero-360-media" aria-hidden="true">
        <Image
          src={FRAMES[frame]}
          alt=""
          width={1536}
          height={1536}
          priority={frame === 0}
          fetchPriority={frame === 0 ? "high" : "auto"}
          quality={90}
          sizes="(max-width: 900px) 92vw, (max-width: 1120px) 48vw, 520px"
          className="hero-v2-product hero-360-product"
          draggable={false}
        />
      </div>

      <div className="hero-360-controls">
        <button type="button" className="hero-360-arrow" aria-label="זווית קודמת" onClick={() => step(-1)}>‹</button>
        <span className="hero-360-hint" aria-hidden="true">360° · גררו / החליקו</span>
        <button type="button" className="hero-360-arrow" aria-label="זווית הבאה" onClick={() => step(1)}>›</button>
      </div>
      <span className="sr-only" aria-live="polite">{announce}</span>
    </div>
  );
}
