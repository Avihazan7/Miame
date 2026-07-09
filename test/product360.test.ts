// Product 360 stage — the drag-to-rotate frame math is pure and must wrap both
// directions and no-op for degenerate frame counts. Locked here independently of
// the DOM so the interaction can't silently regress.

import { describe, expect, it } from "vitest";
import { spinIndex } from "@/components/Product360Stage";

describe("spinIndex", () => {
  it("returns 0 when there are fewer than 2 frames (nothing to spin)", () => {
    expect(spinIndex(0, 500, 0)).toBe(0);
    expect(spinIndex(0, 500, 1)).toBe(0);
  });

  it("advances one frame per ~9px of horizontal drag", () => {
    // +36px from frame 0 → +4 frames
    expect(spinIndex(0, 36, 24)).toBe(4);
    // small jitter under half a step stays put
    expect(spinIndex(5, 4, 24)).toBe(5);
  });

  it("wraps forward past the last frame", () => {
    // frame 23 of 24, drag +18px (+2) → wraps to 1
    expect(spinIndex(23, 18, 24)).toBe(1);
  });

  it("wraps backward below the first frame", () => {
    // frame 0, drag -18px (-2) → wraps to 22
    expect(spinIndex(0, -18, 24)).toBe(22);
  });
});
