// Analytics safety — no pixel loads and no analytics call throws when the
// NEXT_PUBLIC_* marketing ids are absent (the default deployment state). This is
// the runtime half of "consent-first, env-gated marketing": without ids the
// helpers must be pure no-ops, so nothing loads and nothing leaks.
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  hasGa4,
  hasGoogleAds,
  hasMetaPixel,
  hasTikTokPixel,
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
    expect(hasTikTokPixel).toBe(false);
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

describe("consent is a SWITCH — every tag that can be turned on can be turned off", () => {
  // THE BUG THIS PINS, and it shipped: the TikTok tag boots with `disableCookie()`
  // so it measures nothing before the visitor agrees — but `setConsent("granted")`
  // only ever spoke to gtag and fbq. TikTok has no consent API; the COOKIE is its
  // switch, so with no matching enable the tag stayed cookie-disabled FOREVER. That
  // is not extra privacy. It is a pixel that silently never works while the consent
  // banner reports success — the exact shape of failure this repo keeps paying for.
  // Found by the review bot on PR #159, verified here rather than taken on trust.
  const calls: string[] = [];
  const win = () => ({
    localStorage: { getItem: () => null, setItem: () => {} },
    ttq: {
      enableCookie: () => calls.push("enable"),
      disableCookie: () => calls.push("disable"),
    },
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    calls.length = 0;
  });

  it("granting consent ENABLES the TikTok cookie", () => {
    vi.stubGlobal("window", win());
    setConsent("granted");
    expect(calls, "consent was granted and the TikTok tag was never switched on").toEqual(["enable"]);
  });

  it("denying consent DISABLES it again", () => {
    vi.stubGlobal("window", win());
    setConsent("denied");
    expect(calls, "consent was withdrawn and the TikTok tag kept its cookie").toEqual(["disable"]);
  });

  it("a tag that has not finished loading is left alone", () => {
    // The bootstrap stub exists before the script lands. Calling a method that is
    // not there yet would throw inside a helper whose whole contract is never to.
    vi.stubGlobal("window", { localStorage: { getItem: () => null, setItem: () => {} }, ttq: {} });
    expect(() => setConsent("granted")).not.toThrow();
  });
});
