/**
 * lib/turntable.ts — the six angles of MIA FOUR, and the one place their order,
 * yaw and file box are decided.
 *
 * The owner supplied six 3840×3840 renders on 2026-09-08 — one camera, one
 * lighting rig, sixty degrees apart. They are the only genuine 3D source the
 * repo has (public/models/mia-four-x4.glb is a procedural placeholder that is
 * not served), so the Hero's "360" is a frame turntable: six stills crossfaded
 * in yaw order, never a mesh. Every frame was cut with ONE crop from the shared
 * canvas (no per-frame scaling — the renderer's camera is the alignment), the
 * alpha haze under 8% was cleaned, and the result was resampled premultiplied
 * to 1800×1994. Frame 1 alone had been rendered ~10% closer than its mirror
 * twin (frame 6): it was scaled by 0.901 about the bottom-centre of its
 * silhouette and landed on the twin's baseline, so the turntable does not
 * "breathe" when it passes the hero angle. The 4K originals live losslessly in
 * assets-archive/mia-four-360-src-*.webp.
 *
 * Order matters: index i+1 is the front of the vehicle turning to the viewer's
 * RIGHT. Dragging right, ArrowRight and the idle spin all step +1.
 *
 * test/heroTurntable.test.ts holds every file to this box and every yaw to the
 * sixty-degree lattice, so a re-export that drifts fails by number.
 */

export interface TurntableFrame {
  /** Root-relative path under public/. */
  src: string;
  /** Yaw of the camera around the vehicle, degrees. 0 would be dead front. */
  yaw: number;
  /** For the accessible name of the stage while this frame is showing. */
  label: string;
}

/** The shared frame box — declared once, asserted against every file header. */
export const TURNTABLE_W = 1800;
export const TURNTABLE_H = 1994;

/** Pointer travel per frame step when dragging, in CSS px. */
export const TURNTABLE_STEP_PX = 56;

/** Idle spin cadence, ms per step, and the pause after a visitor's own turn. */
export const TURNTABLE_IDLE_MS = 1800;
export const TURNTABLE_REST_AFTER_INPUT_MS = 6000;

export const TURNTABLE_FRAMES: readonly TurntableFrame[] = [
  { src: "/mia-four-360-1.webp", yaw: 30, label: "חזית מימין" },
  { src: "/mia-four-360-2.webp", yaw: 90, label: "צד ימין" },
  { src: "/mia-four-360-3.webp", yaw: 150, label: "אחור מימין" },
  { src: "/mia-four-360-4.webp", yaw: 210, label: "אחור משמאל" },
  { src: "/mia-four-360-5.webp", yaw: 270, label: "צד שמאל" },
  { src: "/mia-four-360-6.webp", yaw: 330, label: "חזית משמאל" },
];

/** Wrap an index into the ring. */
export function wrapFrame(i: number): number {
  const n = TURNTABLE_FRAMES.length;
  return ((i % n) + n) % n;
}
