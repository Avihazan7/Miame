"use client";

import { useEffect } from "react";

/**
 * AmbientLight — "תאורת אווירה אדפטיבית".
 *
 * Paints a fixed, behind-everything atmosphere of soft תכלת (sky/cyan) light
 * that ADAPTS on two axes:
 *   1. Time of day  → hue + intensity shift (bright cyan midday, deeper azure
 *      at night) so the site feels alive at any hour.
 *   2. Cursor       → a gentle spotlight follows the pointer on fine-pointer
 *      devices, lighting the glass surfaces as you move.
 *
 * It only sets CSS custom properties (no React re-renders) and fully backs off
 * when the visitor prefers reduced motion.
 */

type Ambient = { hueA: number; hueB: number; intensity: number };

function ambientForHour(hour: number): Ambient {
  // Hours are local to the visitor — the atmosphere matches their sky.
  if (hour >= 5 && hour < 9) return { hueA: 190, hueB: 208, intensity: 0.82 }; // dawn
  if (hour >= 9 && hour < 17) return { hueA: 186, hueB: 200, intensity: 1.0 }; // bright day
  if (hour >= 17 && hour < 21) return { hueA: 196, hueB: 230, intensity: 0.78 }; // golden dusk
  return { hueA: 205, hueB: 250, intensity: 0.56 }; // evening / night
}

export default function AmbientLight() {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    // 1) Time-of-day adaptation (re-evaluated every few minutes).
    const applyTimeOfDay = () => {
      const { hueA, hueB, intensity } = ambientForHour(new Date().getHours());
      root.style.setProperty("--amb-hue-a", String(hueA));
      root.style.setProperty("--amb-hue-b", String(hueB));
      root.style.setProperty("--amb-intensity", intensity.toFixed(2));
    };
    applyTimeOfDay();
    const clock = window.setInterval(applyTimeOfDay, 5 * 60 * 1000);

    // 2) Cursor spotlight (skipped for reduced-motion / touch).
    let raf = 0;
    let tx = 50;
    let ty = 32;
    let cx = 50;
    let cy = 32;
    const ease = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      root.style.setProperty("--mx", cx.toFixed(2) + "%");
      root.style.setProperty("--my", cy.toFixed(2) + "%");
      if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) {
        raf = requestAnimationFrame(ease);
      } else {
        raf = 0;
      }
    };
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth) * 100;
      ty = (e.clientY / window.innerHeight) * 100;
      root.style.setProperty("--amb-spot", "1");
      if (!raf) raf = requestAnimationFrame(ease);
    };

    root.style.setProperty("--mx", "50%");
    root.style.setProperty("--my", "30%");

    if (finePointer && !reduce) {
      root.classList.add("amb-live");
      window.addEventListener("pointermove", onMove, { passive: true });
    }

    // 3) Scroll-linked flow — the aurora drifts at its own pace as you move down
    //    the page, giving the atmosphere a sense of forward motion and lift.
    //    Pure CSS-var write (no layout reads beyond scrollY), rAF-throttled.
    let sraf = 0;
    const onScroll = () => {
      if (sraf) return;
      sraf = requestAnimationFrame(() => {
        const y = window.scrollY || 0;
        root.style.setProperty("--amb-scroll", (y * 0.06).toFixed(1) + "px");
        sraf = 0;
      });
    };
    if (!reduce) {
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    return () => {
      window.clearInterval(clock);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      if (sraf) cancelAnimationFrame(sraf);
      root.classList.remove("amb-live");
    };
  }, []);

  return (
    <div className="ambient" aria-hidden="true">
      <span className="amb-blob amb-1" />
      <span className="amb-blob amb-2" />
      <span className="amb-blob amb-3" />
      <span className="amb-aurora" />
      <span className="amb-spotlight" />
      <span className="amb-sweep" />
      <span className="amb-grain" />
    </div>
  );
}
