// Analytics safety — no pixel loads and no analytics call throws when the
// NEXT_PUBLIC_* marketing ids are absent (the default deployment state). This is
// the runtime half of "consent-first, env-gated marketing": without ids the
// helpers must be pure no-ops, so nothing loads and nothing leaks.
import { describe, expect, it } from "vitest";
import {
  hasGa4,
  hasGoogleAds,
  hasMetaPixel,
  marketingEnabled,
  ga4Event,
  metaEvent,
  adsConversion,
  readConsent,
  setConsent,
} from "@/lib/marketing";

describe("marketing pixels are env-gated (no ids in test env)", () => {
  it("reports every channel disabled when no NEXT_PUBLIC id is set", () => {
    expect(hasGa4).toBe(false);
    expect(hasGoogleAds).toBe(false);
    expect(hasMetaPixel).toBe(false);
    expect(marketingEnabled).toBe(false);
  });

  it("event helpers are no-ops and never throw without ids", () => {
    expect(() => ga4Event("select_promotion", { placement: "deal-buzz" })).not.toThrow();
    expect(() => metaEvent("DealBuzzClick", { placement: "deal-buzz" }, false)).not.toThrow();
    expect(() => adsConversion("", {})).not.toThrow();
    // no return value is surfaced (pure side-effect no-op)
    expect(ga4Event("select_promotion")).toBeUndefined();
  });
});

describe("consent helpers are SSR-safe (no window)", () => {
  it("readConsent returns null and setConsent never throws server-side", () => {
    expect(readConsent()).toBeNull();
    expect(() => setConsent("denied")).not.toThrow();
  });
});
