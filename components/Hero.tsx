"use client";

// components/Hero.tsx — Ultra Master Hero Gate V4 · STUDIO LIGHT.
// One promise (H1), one primary action (#sim), one secondary (#cinema), on the
// same white ground as the launch strip above it and lit by the site's adaptive
// ambient light (V3 was a dark gate with its own palette — retired 2026-09-08 on
// the owner's call). Brand Lexicon glyphs are SVG (never system emoji); real
// emoji live only in native channels (WhatsApp / OG). Palette, type and the 3D
// stage are scoped in app/miame-hero-v2.css.

import Image from "next/image";
import { useEffect, useRef } from "react";
import LexIcon from "@/components/LexIcon";
import { track } from "@/lib/analytics";
import { WARRANTY_TERM } from "@/lib/content";

/** Degrees of yaw / pitch at the stage's edge. Small on purpose: the product is a
 *  still, and past ~8° a flat still starts to read as a card, not an object. */
const TILT_YAW_DEG = 7;
const TILT_PITCH_DEG = 5;

export default function Hero() {
  const stageRef = useRef<HTMLDivElement>(null);

  // ── The 3D stage's pointer axis ─────────────────────────────────────────────
  // Writes four custom properties on the stage (--tilt-x/--tilt-y in degrees,
  // --sheen-x/--sheen-y in %), which app/miame-hero-v2.css turns into a
  // perspective tilt of the product and a pool of the room's light under the
  // pointer. Same discipline as AmbientLight and CardSpotlight: CSS variables,
  // no React state, one rAF per frame at most. Scoped to the stage element, so
  // it cannot collide with the --mx/--my the page-level spotlight writes on
  // <html>.
  //
  // Gated on `(pointer: fine)` — a finger cannot hover, so on touch the
  // stylesheet gives the stage a slow idle turn instead — and on
  // `(prefers-reduced-motion: reduce)`, for whom neither happens: the product
  // stands still. Both gates are also asserted by test/heroLight.test.ts.
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
      // "Look around" convention: the side under the pointer comes toward the
      // viewer (rotateY is negative for +x in CSS's left-handed screen space).
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

          {/* The H1 names the product now, and keeps its line.
              Measured 2026-09-01 it read "החופש שלך. עכשיו בתנועה." alone — the
              second most weighted element on the strongest page of the domain,
              naming nothing anyone searches for. The naming line goes FIRST and
              small: it carries מיה פור and קלנועית for a crawler and for an answer
              engine resolving the entity, while the two large lines below stay
              exactly as they were and still open the page.
              Hebrew here on purpose — the eyebrow directly above already carries
              the Latin "MIA FOUR", so both scripts are present without either
              being said twice.
              aria-label carries all three lines: the children are aria-hidden, so
              the label IS the accessible name, and a screen reader that heard only
              the poetry would be getting a different H1 than the one on screen. */}
          <h1
            className="hero-v2-title"
            aria-label="מיה פור · קלנועית חשמלית. החופש שלך, עכשיו בתנועה."
          >
            <span className="hero-v2-h1-name" aria-hidden="true">
              מיה פור · קלנועית חשמלית
            </span>
            <span aria-hidden="true">החופש שלך.</span>
            <strong aria-hidden="true">
              עכשיו בתנועה.<LexIcon name="liberty" className="hero-v2-h1-icon" />
            </strong>
          </h1>

          {/* The first paragraph after the H1, which is the most heavily read
              prose on the strongest page — and it named the product in Latin
              only and called it "ניידות חשמלית", a phrase nobody searches. The
              H1 above keeps its line; this sentence does the naming: the Hebrew
              name (מיה פור), the Latin one, and what the thing legally IS
              (קלנועית — the site's own legal page is explicit that it is not a
              רכב, and it is also the word buyers type). */}
          <p className="hero-v2-sub">
            <bdi dir="ltr">MIA FOUR</bdi> · מיה פור, קלנועית חשמלית פרימיום על ארבעה גלגלים.
            עוצמה, יציבות וחופש שמתאימים לחיים שלכם.
          </p>

          <p className="hero-v2-finance">
            <LexIcon name="check" /> עד 18 תשלומים ללא ריבית והצמדה*
          </p>

          <div className="hero-v2-actions">
            <a
              className="btn hero-v2-primary"
              href="#sim"
              data-event="HeroPrimaryCTA"
              onClick={() => void track("HeroPrimaryCTA")}
            >
              בדיקת התאמה
            </a>
            <a
              className="btn hero-v2-secondary"
              href="#cinema"
              data-event="HeroSecondaryCTA"
              onClick={() => void track("HeroSecondaryCTA")}
            >
              צפו ב-MIA FOUR
            </a>
          </div>

          <div className="hero-v2-trust">
            <span><LexIcon name="p-roundel" /> יבואן רשמי</span>
            <span>מחקר ופיתוח ישראלי 🇮🇱</span>
            <span>{WARRANTY_TERM}</span>
            <span dir="ltr">EN17128</span>
          </div>

          <p className="hero-v2-legal">
            *בכפוף לאישור עסקה, זמינות מלאי ותנאי החברה/היבואן.
          </p>
        </div>

        <div className="hero-v2-visual">
          <div className="hero-v2-product-stage" ref={stageRef}>
            <div className="hero-v2-orbit hero-v2-orbit-a" aria-hidden="true" />
            <div className="hero-v2-orbit hero-v2-orbit-b" aria-hidden="true" />
            <div className="hero-v2-sheen" aria-hidden="true" />
            <div className="hero-v2-ground" aria-hidden="true" />

            {/* The studio still, at the file's full intrinsic detail (1400×1498 —
                test/imageLayout.test.ts holds width/height to the header).
                `sizes` is the slot the grid actually gives: 92vw stacked, ~48vw in
                the two-column band, and a 520px ceiling once --maxw caps the
                container — DERIVED in test/heroLight.test.ts from --maxw and the
                grid, so the browser fetches the rendition the edge needs and not
                the one a guess allowed. quality=90 (default 75): this is the LCP
                and the product; the extra bytes buy clean edges on the cut-out,
                which is where AVIF/WebP at 75 ring first. */}
            <Image
              src="/mia-four-x6-studio.webp"
              alt="MIA FOUR, קלנועית חשמלית פרימיום על ארבעה גלגלים"
              width={1400}
              height={1498}
              priority
              fetchPriority="high"
              quality={90}
              sizes="(max-width: 900px) 92vw, (max-width: 1120px) 48vw, 520px"
              className="hero-v2-product"
            />

            <div className="hero-v2-power-chip">
              <span>עד</span><b dir="ltr">4×1,800W</b>
            </div>
            <div className="hero-v2-free-chip">
              <LexIcon name="butterfly" /> FREE FEEL
            </div>
          </div>
        </div>
      </div>

      <a
        href="#models"
        className="hero-v2-scroll-cue"
        data-event="HeroScrollCue"
        aria-label="גלילה לדגמים"
        onClick={() => void track("HeroScrollCue")}
      >
        <span aria-hidden="true">▾</span>
      </a>
    </section>
  );
}
