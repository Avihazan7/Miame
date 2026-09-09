"use client";

// components/Hero.tsx — Ultra Master Hero Gate V4 · STUDIO LIGHT · THRESHOLD · 360.
// One promise (H1), one primary action (#sim), one secondary (#cinema), on the
// same white ground as the launch strip above it and lit by the site's adaptive
// ambient light (V3 was a dark gate with its own palette — retired 2026-09-08 on
// the owner's call). The product stands on a threshold stage: a pane of waxed
// glass it has stepped out of, with entrance, idle float, pointer parallax at
// three depths and a specular sweep clipped to its own silhouette — all of it
// CSS in app/miame-hero-v2.css. And it TURNS: the owner's six 4K renders, sixty
// degrees apart (lib/turntable.ts), crossfade in yaw order — an idle spin, a
// drag in either direction, or the arrow keys. This file writes the few numbers
// the stylesheet reads and owns the frame index; nothing else re-renders.
// Brand Lexicon glyphs are SVG (never system emoji); real emoji live only in
// native channels (WhatsApp / OG).

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import LexIcon from "@/components/LexIcon";
import { track } from "@/lib/analytics";
import { onAmbienceTilt } from "@/lib/ambience";
import { WARRANTY_TERM } from "@/lib/content";
import {
  TURNTABLE_FRAMES,
  TURNTABLE_H,
  TURNTABLE_IDLE_MS,
  TURNTABLE_REST_AFTER_INPUT_MS,
  TURNTABLE_STEP_PX,
  TURNTABLE_W,
  wrapFrame,
} from "@/lib/turntable";

/** Degrees of yaw / pitch at the stage's edge. Small on purpose: the product is a
 *  still, and past ~8° a flat still starts to read as a card, not an object. */
const TILT_YAW_DEG = 7;
const TILT_PITCH_DEG = 5;

/** The one next/image that is the LCP: the hero angle, in flow, priority. Everything
 *  else on the stage is decoration or arrives after it. The overlays share its
 *  `sizes` string through HERO_SIZES; test/heroTurntable.test.ts holds the two equal. */
const HERO_FRAME = TURNTABLE_FRAMES[0];
const HERO_SIZES = "(max-width: 900px) 92vw, (max-width: 1120px) 48vw, 520px";

export default function Hero() {
  const stageRef = useRef<HTMLDivElement>(null);
  /** Which of the six angles is showing. 0 is the hero angle, the base image. */
  const [frame, setFrame] = useState(0);
  /** The five other angles are MOUNTED once the LCP has landed and the browser
   *  is idle — they must never compete with it for bandwidth. */
  const [mounted, setMounted] = useState(false);
  /** Which angles have actually painted, by their OWN load event.
   *
   *  This is the fix for a bug that reached production on 2026-09-08 and showed
   *  as an EMPTY STAGE: the previous version armed the turntable from a manual
   *  `new Image(); im.src = "/mia-four-360-2.webp"` preload, but next/image does
   *  not request that path — it requests
   *  `/_next/image?url=%2Fmia-four-360-2.webp&w=750&q=90`. Two different URLs,
   *  two different cache entries. So the controls appeared while the overlays
   *  still had no bytes, and the first turn hid the base image (correct — the
   *  frames are cut-outs) over an overlay that had not painted. Nothing on
   *  screen. Warming a URL nobody requests is not a preload; the only honest
   *  readiness signal is the element's own `load`. */
  const [loaded, setLoaded] = useState<ReadonlySet<number>>(() => new Set());
  const markLoaded = useCallback((i: number) => {
    setLoaded((prev) => (prev.has(i) ? prev : new Set(prev).add(i)));
  }, []);
  /** The stage can turn only when EVERY angle is on screen-ready. */
  const spin = loaded.size === TURNTABLE_FRAMES.length;
  const lastInput = useRef(0);

  // ── The stage's pointer axis ────────────────────────────────────────────────
  // Writes custom properties on the stage — --tilt-x/--tilt-y in degrees,
  // --par-x/--par-y unitless −1…1, --sheen-x/--sheen-y in % — which
  // app/miame-hero-v2.css turns into the product's perspective tilt, a parallax
  // at three depths (far rings against the pointer, pane with it a little, rig
  // with it more) and a pool of the room's light under the pointer. Same
  // discipline as AmbientLight and CardSpotlight: CSS variables, no React state,
  // one rAF per frame at most. Scoped to the stage element, so it cannot collide
  // with the --mx/--my the page-level spotlight writes on <html>.
  //
  // Gated on `(pointer: fine)` — a finger cannot hover, so on touch the
  // stylesheet gives the stage a slow idle turn instead — and on
  // `(prefers-reduced-motion: reduce)`, for whom neither happens: the product
  // stands still. Both gates are asserted by test/heroLight.test.ts.
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
      el.style.setProperty("--par-x", next.x.toFixed(3));
      el.style.setProperty("--par-y", next.y.toFixed(3));
      el.style.setProperty("--sheen-x", (50 + next.x * 50).toFixed(1) + "%");
      el.style.setProperty("--sheen-y", (50 + next.y * 50).toFixed(1) + "%");
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const clamp = (v: number) => Math.max(-1, Math.min(1, v));
      next = {
        x: clamp(((e.clientX - r.left) / r.width) * 2 - 1),
        y: clamp(((e.clientY - r.top) / r.height) * 2 - 1),
      };
      el.style.setProperty("--sheen", "1");
      if (!raf) raf = requestAnimationFrame(write);
    };
    // Leaving the stage puts every layer back to rest — otherwise the last
    // pointer position would stay frozen into the parallax.
    const onLeave = () => {
      next = null;
      el.style.setProperty("--tilt-x", "0deg");
      el.style.setProperty("--tilt-y", "0deg");
      el.style.setProperty("--par-x", "0");
      el.style.setProperty("--par-y", "0");
      el.style.setProperty("--sheen-x", "50%");
      el.style.setProperty("--sheen-y", "50%");
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

  // ── The material ────────────────────────────────────────────────────────────
  // The specular sweep is clipped to the product's silhouette with a CSS mask —
  // and the mask must be the SAME bytes an <img> already fetched, never a second
  // request. So the URL is read back from the showing frame's img.currentSrc
  // (the rendition next/image actually chose for this viewport) and written into
  // --product-src on the stage; the stylesheet contains no url() at all. `load`
  // is listened to, not `once`: a srcset re-selection after a resize fires load
  // again and the mask follows the new candidate — still a cache hit.
  //
  // The same effect makes the wax catch the light when the room changes colour:
  // the configurator publishes a model on lib/ambience's bus, the hue glides on
  // the @property transition in globals.css, and the band gets one transform-only
  // sweep through the Web Animations API (it outranks the CSS idle loop while it
  // runs and leaves no fill, so the loop resumes untouched).
  //
  // Reduced motion returns before any of it: no mask, no glint, no subscription.
  // The band is parked off-surface at rest, so without motion there is nothing
  // for the gloss to show — and nothing is a fine answer.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const img = el.querySelector<HTMLImageElement>("img.hero-v2-product-img");
    const band = el.querySelector<HTMLElement>(".hero-v2-gloss-band");
    if (!img) return;

    const sync = () => {
      const src = img.currentSrc || img.src;
      if (!src) return;
      el.style.setProperty("--product-src", 'url("' + src.replace(/["\\]/g, encodeURIComponent) + '")');
      el.dataset.material = "ready";
    };
    if (img.complete && img.naturalWidth > 0) sync();
    img.addEventListener("load", sync);

    const stop = onAmbienceTilt(() => {
      band?.animate(
        [{ transform: "translateX(-140%)" }, { transform: "translateX(240%)" }],
        { duration: 1400, easing: "cubic-bezier(.2,.7,.2,1)" },
      );
    });

    return () => {
      img.removeEventListener("load", sync);
      stop();
    };
  }, []);

  // ── The wax turns with the vehicle ──────────────────────────────────────────
  // Two things happen on every angle change, and they are the whole reason the
  // finish is called Wax Nano Cristal rather than "a gloss".
  //
  // 1. THE SILHOUETTE FOLLOWS. The specular layer is masked to the product's
  //    outline, so a mask left on the previous angle would light the shape of a
  //    vehicle that is no longer there. It reads the SHOWING image's own
  //    currentSrc — the bytes already decoded, never a second request — and that
  //    includes frame 0, whose image is the base <img>: the first version of
  //    this effect returned early on 0 and left the mask stuck on angle 5.
  // 2. THE LIGHT CATCHES IT. One transform-only sweep across the masked body,
  //    every time the vehicle turns. On a hard-cut turntable this is what tells
  //    the eye a surface moved rather than a picture swapped — the material
  //    doing the work the crossfade used to fake. It outranks the CSS idle loop
  //    while it runs and leaves no fill, so the loop resumes untouched, and it
  //    is skipped for a visitor who asked for reduced motion (the stage carries
  //    no mask at all for them).
  const firstAngle = useRef(true);
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !el.dataset.material) return;
    const img = frame === 0
      ? el.querySelector<HTMLImageElement>("img.hero-v2-product-img")
      : el.querySelector<HTMLImageElement>(`img.hero-v2-frame[data-index="${frame}"]`);
    const src = img?.currentSrc || img?.src;
    if (!img || !img.complete || !src) return;
    el.style.setProperty("--product-src", 'url("' + src.replace(/["\\]/g, encodeURIComponent) + '")');

    if (firstAngle.current) { firstAngle.current = false; return; }
    el.querySelector<HTMLElement>(".hero-v2-gloss-band")?.animate(
      [{ transform: "translateX(-140%)" }, { transform: "translateX(240%)" }],
      { duration: 900, easing: "cubic-bezier(.2,.7,.2,1)" },
    );
  }, [frame]);

  // ── The turntable ───────────────────────────────────────────────────────────
  // Step to a neighbouring angle, but only onto a frame whose bytes have
  // arrived: a step onto an unloaded frame would show the base angle through a
  // transparent overlay. A visitor's own turn also rests the idle spin.
  const step = useCallback((dir: 1 | -1, byVisitor: boolean) => {
    if (byVisitor) lastInput.current = performance.now();
    setFrame((f) => wrapFrame(f + dir));
  }, []);

  // 1) Mount the other angles only after the LCP has landed and the main thread
  //    is idle — never in the same breath as the hero image.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const img = el.querySelector<HTMLImageElement>("img.hero-v2-product-img");
    if (!img) return;
    let idle = 0;
    let timer = 0;
    let cancelled = false;
    const arm = () => {
      // Mount the overlays. They then fetch their own renditions through
      // next/image, and each reports readiness with its own `load` — which is
      // what arms the turntable. No manual preload: see the note on `loaded`.
      const go = () => { if (!cancelled) setMounted(true); };
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(go, { timeout: 2500 });
      else timer = window.setTimeout(go, 1200);
    };
    if (img.complete && img.naturalWidth > 0) arm();
    else img.addEventListener("load", arm, { once: true });
    return () => {
      cancelled = true;
      img.removeEventListener("load", arm);
      if (idle && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  // 2) The idle spin: one step every TURNTABLE_IDLE_MS while the stage is on
  //    screen, nobody is dragging, the visitor has not turned it themselves in
  //    the last few seconds — and never for reduced motion (a turn the visitor
  //    asks for is still honoured, as a cut). Touch gets it too: it is the one
  //    slow idle motion a phone is allowed.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !spin) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let onScreen = false;
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }, { threshold: 0.2 });
    io.observe(el);
    const tick = window.setInterval(() => {
      if (!onScreen || document.hidden) return;
      if (el.classList.contains("is-dragging")) return;
      if (performance.now() - lastInput.current < TURNTABLE_REST_AFTER_INPUT_MS) return;
      step(1, false);
    }, TURNTABLE_IDLE_MS);
    return () => { io.disconnect(); window.clearInterval(tick); };
  }, [spin, step]);

  // 3) Drag to turn (mouse, pen or finger — the stage's touch-action keeps
  //    vertical panning for the page) and the arrow keys.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !spin) return;
    let startX = 0;
    let travelled = 0;
    let active = false;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      if ((e.target as Element | null)?.closest("button")) return;
      active = true; startX = e.clientX; travelled = 0;
      el.setPointerCapture(e.pointerId);
      el.classList.add("is-dragging");
      lastInput.current = performance.now();
    };
    const onDrag = (e: PointerEvent) => {
      if (!active) return;
      const dx = e.clientX - startX - travelled;
      if (Math.abs(dx) >= TURNTABLE_STEP_PX) {
        const dir: 1 | -1 = dx > 0 ? 1 : -1;
        travelled += dir * TURNTABLE_STEP_PX;
        step(dir, true);
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!active) return;
      active = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      el.classList.remove("is-dragging");
      lastInput.current = performance.now();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); step(1, true); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1, true); }
      else if (e.key === "Home") { e.preventDefault(); lastInput.current = performance.now(); setFrame(0); }
      else if (e.key === "End") { e.preventDefault(); lastInput.current = performance.now(); setFrame(TURNTABLE_FRAMES.length - 1); }
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onDrag, { passive: true });
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onDrag);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("keydown", onKey);
    };
  }, [spin, step]);

  const showing = TURNTABLE_FRAMES[frame];

  return (
    <section className="hero-v2" aria-label="MIA FOUR · Electric Freedom">
      <div className="hero-v2-energy hero-v2-energy-a" aria-hidden="true" />
      <div className="hero-v2-energy hero-v2-energy-b" aria-hidden="true" />

      <div className="wrap hero-v2-grid">
        <div className="hero-v2-copy">
          {/* ONE line of copy, on the owner's call (2026-09-08): the eyebrow, the
              two poetry lines, the lede paragraph and the trust row were struck
              out on a live screenshot — "delete the verbiage" — and the product
              took their place at the top of the screen.
              What stays is what the page cannot lose: an H1 that names the thing
              (מיה פור · קלנועית חשמלית — the entity a crawler and an answer
              engine resolve on, and the words a buyer types), the offer, the two
              actions, and the legal line. A page with no H1 forfeits its search
              anchor, which is not a design decision — so this line is the floor,
              not a leftover. */}
          {/* The owner dictated this line on 2026-09-09, word for word, under the
              product: name, category, Latin name. It carries all three tokens an
              answer engine needs to resolve the entity, which the Hebrew-only
              version left to the Product schema alone.
              THE BIDI TRAP, and why the spaces here are not ordinary ones: the
              Hebrew-only H1 exists because an earlier version with "MIA FOUR" in
              it wrapped mid-phrase and the bidi algorithm stranded a lone "·" at
              the end of line 2 at 1440px. A separator can only strand if a line
              is allowed to BREAK AFTER it, so each "-" is bound to the token that
              follows it with a non-breaking space. A break can now happen before
              a separator and never after one, at any width. */}
          <h1 className="hero-v2-title">מיה פור -&nbsp;קלנועית -&nbsp;MIA FOUR</h1>

          <p className="hero-v2-finance">
            <LexIcon name="check" /> עד 18 תשלומים ללא ריבית והצמדה*
          </p>

          {/* id, not a class: StickyCta watches THIS box to know when the visitor
              still has the Hero's own CTAs, so the mobile bar never covers them. */}
          <div className="hero-v2-actions" id="hero-cta">
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

          <p className="hero-v2-legal">
            *בכפוף לאישור עסקה, זמינות מלאי ותנאי החברה/היבואן. {WARRANTY_TERM}.
          </p>
        </div>

        <div className="hero-v2-visual">
          {/* The threshold stage. Layer order is the stylesheet's contract — see
              the "visual column" block in app/miame-hero-v2.css. Everything here
              but the base next/image is decoration and hidden from assistive tech;
              the stage itself is the one control (drag or arrow keys turn the
              vehicle), so it is focusable and says which angle is showing. */}
          <div
            className="hero-v2-product-stage"
            ref={stageRef}
            role="group"
            tabIndex={0}
            aria-label={`מיה פור בסיבוב 360°, ${showing.label}. חצים ימינה ושמאלה מסובבים.`}
            data-spin={spin ? "" : undefined}
          >
            <div className="hero-v2-far" aria-hidden="true">
              <div className="hero-v2-orbit hero-v2-orbit-a" />
              <div className="hero-v2-orbit hero-v2-orbit-b" />
            </div>

            <div className="hero-v2-body">
              <div className="hero-v2-plane" aria-hidden="true" />
              <div className="hero-v2-sheen" aria-hidden="true" />
              <div className="hero-v2-ground" aria-hidden="true" />

              <div className="hero-v2-rig">
                <div className="hero-v2-product">
                  {/* The hero angle, at the frame box's full detail (1800×1994 —
                      test/imageLayout.test.ts holds width/height to the header;
                      test/heroTurntable.test.ts holds them to lib/turntable.ts).
                      `sizes` is the slot the grid actually gives: 92vw stacked,
                      ~48vw in the two-column band, and a 520px ceiling once
                      --maxw caps the container — DERIVED in test/heroLight.test.ts
                      from --maxw and the grid. quality=90 (default 75): this is
                      the LCP and the product; the extra bytes buy clean edges on
                      the cut-out, which is where AVIF/WebP at 75 ring first. It
                      is the ONLY in-flow child of the rig, so the reserved box is
                      the image's own. While another angle is showing it is
                      hidden (visibility, never opacity) — the frames are
                      cut-outs, and an opaque base would show through the
                      silhouette of every other angle. Measured live on
                      2026-09-08: two vehicles at once on a phone. */}
                  <Image
                    src="/mia-four-360-1.webp"
                    alt="MIA FOUR, קלנועית חשמלית פרימיום על ארבעה גלגלים"
                    width={1800}
                    height={1994}
                    priority
                    fetchPriority="high"
                    quality={92}
                    sizes="(max-width: 900px) 92vw, (max-width: 1120px) 48vw, 520px"
                    draggable={false}
                    className="hero-v2-product-img"
                    data-covered={frame !== 0 && loaded.has(frame) ? "true" : undefined}
                  />
                  {/* The other angles, mounted after the LCP has landed. Each is
                      the base box's absolute twin; the stylesheet crossfades the
                      active one in over the opaque base. Frame 0 is included as
                      an overlay too (same URL — a cache hit), so a turn back to
                      the hero angle fades like every other step. */}
                  {mounted && TURNTABLE_FRAMES.map((f, i) => (
                    <Image
                      key={f.src}
                      src={f.src}
                      alt=""
                      aria-hidden="true"
                      width={TURNTABLE_W}
                      height={TURNTABLE_H}
                      quality={92}
                      sizes={HERO_SIZES}
                      fetchPriority="low"
                      draggable={false}
                      className="hero-v2-frame"
                      data-index={i}
                      data-active={i === frame && loaded.has(i) ? "true" : undefined}
                      onLoad={() => markLoaded(i)}
                    />
                  ))}
                  {/* the room's light pooling low on the vehicle, at the wheels
                      and the undercarriage — masked to the silhouette by the
                      SAME machinery as the gloss, so it falls on the product and
                      never on the floor behind it. Static: a gradient costs
                      nothing per frame, and the sweep above is the moving one. */}
                  <span className="hero-v2-underlight" aria-hidden="true" />
                  <span className="hero-v2-gloss" aria-hidden="true">
                    <span className="hero-v2-gloss-band" />
                  </span>
                </div>
              </div>
            </div>

            <div className="hero-v2-free-chip">
              <LexIcon name="butterfly" /> FREE FEEL
            </div>

            {/* The turntable's visible handles. A finger cannot find "drag to
                turn" on its own, and a mouse should not have to guess either:
                two arrows, one hint, and a polite announcement of the angle for
                a screen reader. They appear with the frames (data-spin), so the
                stage never advertises a turn it cannot yet make. Rendered inside
                the stage, so the drag listener sees them — and ignores them. */}
            <div className="hero-v2-turn" hidden={!spin}>
              <button type="button" className="hero-v2-turn-btn" aria-label="זווית קודמת" onClick={() => step(-1, true)}>
                <span aria-hidden="true">‹</span>
              </button>
              <span className="hero-v2-turn-hint" aria-hidden="true" dir="ltr">360° · <bdi>גררו לסיבוב</bdi></span>
              <button type="button" className="hero-v2-turn-btn" aria-label="זווית הבאה" onClick={() => step(1, true)}>
                <span aria-hidden="true">›</span>
              </button>
              <span className="sr-only" aria-live="polite">{showing.label}</span>
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
