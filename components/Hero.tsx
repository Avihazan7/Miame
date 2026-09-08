"use client";

// components/Hero.tsx — Ultra Master Hero Gate V5 · SIX-SOURCE 360.
import { useEffect, useRef } from "react";
import HeroTurntable from "@/components/HeroTurntable";
import LexIcon from "@/components/LexIcon";
import { track } from "@/lib/analytics";
import { WARRANTY_TERM } from "@/lib/content";

const TILT_YAW_DEG = 4;
const TILT_PITCH_DEG = 3;

export default function Hero() {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    let raf = 0;
    let next: { x: number; y: number } | null = null;
    const write = () => {
      raf = 0;
      if (!next) return;
      el.style.setProperty("--tilt-x", (-next.x * TILT_YAW_DEG).toFixed(2) + "deg");
      el.style.setProperty("--tilt-y", (next.y * TILT_PITCH_DEG).toFixed(2) + "deg");
      el.style.setProperty("--sheen-x", (50 + next.x * 50).toFixed(1) + "%");
      el.style.setProperty("--sheen-y", (50 + next.y * 50).toFixed(1) + "%");
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      next = {
        x: ((e.clientX - r.left) / r.width) * 2 - 1,
        y: ((e.clientY - r.top) / r.height) * 2 - 1,
      };
      el.style.setProperty("--sheen", "1");
      if (!raf) raf = requestAnimationFrame(write);
    };
    const onLeave = () => {
      next = null;
      el.style.setProperty("--tilt-x", "0deg");
      el.style.setProperty("--tilt-y", "0deg");
      el.style.setProperty("--sheen", "0");
    };
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="hero-v2" aria-label="MIA FOUR · Electric Freedom">
      <div className="hero-v2-energy hero-v2-energy-a" aria-hidden="true" />
      <div className="hero-v2-energy hero-v2-energy-b" aria-hidden="true" />

      <div className="wrap hero-v2-grid">
        <div className="hero-v2-copy">
          <span className="hero-v2-eyebrow" dir="ltr">
            <LexIcon name="m-roundel" /> MIA FOUR · ELECTRIC FREEDOM <LexIcon name="bolt" />
          </span>
          <h1 className="hero-v2-title" aria-label="מיה פור · קלנועית חשמלית. החופש שלך, עכשיו בתנועה.">
            <span className="hero-v2-h1-name" aria-hidden="true">מיה פור · קלנועית חשמלית</span>
            <span aria-hidden="true">החופש שלך.</span>
            <strong aria-hidden="true">עכשיו בתנועה.<LexIcon name="liberty" className="hero-v2-h1-icon" /></strong>
          </h1>
          <p className="hero-v2-sub">
            <bdi dir="ltr">MIA FOUR</bdi> · מיה פור, קלנועית חשמלית פרימיום על ארבעה גלגלים.
            עוצמה, יציבות וחופש שמתאימים לחיים שלכם.
          </p>
          <p className="hero-v2-finance"><LexIcon name="check" /> עד 18 תשלומים ללא ריבית והצמדה*</p>
          <div className="hero-v2-actions">
            <a className="btn hero-v2-primary" href="#sim" data-event="HeroPrimaryCTA" onClick={() => void track("HeroPrimaryCTA")}>בדיקת התאמה</a>
            <a className="btn hero-v2-secondary" href="#cinema" data-event="HeroSecondaryCTA" onClick={() => void track("HeroSecondaryCTA")}>צפו ב-MIA FOUR</a>
          </div>
          <div className="hero-v2-trust">
            <span><LexIcon name="p-roundel" /> יבואן רשמי</span>
            <span>מחקר ופיתוח ישראלי 🇮🇱</span>
            <span>{WARRANTY_TERM}</span>
            <span dir="ltr">EN17128</span>
          </div>
          <p className="hero-v2-legal">*בכפוף לאישור עסקה, זמינות מלאי ותנאי החברה/היבואן.</p>
        </div>

        <div className="hero-v2-visual">
          <div className="hero-v2-product-stage" ref={stageRef}>
            <div className="hero-v2-orbit hero-v2-orbit-a" aria-hidden="true" />
            <div className="hero-v2-orbit hero-v2-orbit-b" aria-hidden="true" />
            <div className="hero-v2-sheen" aria-hidden="true" />
            <div className="hero-v2-ground" aria-hidden="true" />
            <HeroTurntable />
            <div className="hero-v2-power-chip"><span>עד</span><b dir="ltr">4×1,800W</b></div>
            <div className="hero-v2-free-chip"><LexIcon name="butterfly" /> FREE FEEL</div>
          </div>
        </div>
      </div>

      <a href="#models" className="hero-v2-scroll-cue" data-event="HeroScrollCue" aria-label="גלילה לדגמים" onClick={() => void track("HeroScrollCue")}>
        <span aria-hidden="true">▾</span>
      </a>
    </section>
  );
}
