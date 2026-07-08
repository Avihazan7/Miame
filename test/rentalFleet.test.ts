// Rental Fleet OS v1 contract — the Eilat fleet roster is a source of truth for
// both the public site and the future admin dashboard, so its shape is locked.

import { describe, expect, it } from "vitest";
import {
  RENTAL_FLEET,
  FLEET_SIZE,
  availableAssets,
  fleetByModel,
} from "@/lib/rental-fleet";
import { ituranAdapter } from "@/lib/tracking/ituran";

describe("rental fleet · Eilat v1", () => {
  it("starts with exactly 15 assets", () => {
    expect(FLEET_SIZE).toBe(15);
    expect(RENTAL_FLEET).toHaveLength(15);
  });

  it("every asset is in Eilat with a unique, well-formed code", () => {
    const codes = new Set<string>();
    for (const a of RENTAL_FLEET) {
      expect(a.zone).toBe("eilat");
      expect(a.code).toMatch(/^MIA-EIL-\d{2}$/);
      expect(["available", "reserved", "maintenance"]).toContain(a.status);
      codes.add(a.code);
    }
    expect(codes.size).toBe(15);
  });

  it("availability is a subset of the fleet (never fabricated above roster)", () => {
    const avail = availableAssets();
    expect(avail.length).toBeLessThanOrEqual(FLEET_SIZE);
    expect(avail.every((a) => a.status === "available")).toBe(true);
  });

  it("fleetByModel sums back to the fleet size", () => {
    const byModel = fleetByModel();
    const sum = Object.values(byModel).reduce((a, b) => a + b, 0);
    expect(sum).toBe(FLEET_SIZE);
  });

  it("the tracker adapter is honest: not live until official docs", () => {
    expect(ituranAdapter.integration).toBe("ituran-tick-track");
    expect(ituranAdapter.ready).toBe(false);
    expect(ituranAdapter.state).toBe("pending_docs");
  });
});
