// Analytics safety — no pixel loads and no analytics call throws when the
// NEXT_PUBLIC_* marketing ids are absent (the default deployment state). This is
// the runtime half of "consent-first, env-gated marketing": without ids the
// helpers must be pure no-ops, so nothing loads and nothing leaks.
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
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

// ── every third party the browser talks to is named in the privacy policy ────
//
// THE DEFECT THIS CLOSES (audit, 2026-09-09). components/MarketingScripts.tsx has
// shipped a TikTok pixel since the marketing pass — lib/marketing.ts:17 reads
// NEXT_PUBLIC_TIKTOK_PIXEL_ID, next.config.js opens `script-src` and `connect-src`
// for analytics.tiktok.com, and the file's own comment explains that TikTok was
// "the one paid channel with a live profile and no way to measure it".
//
// app/legal/privacy/page.tsx named Google Analytics 4, Google Ads and Meta Pixel.
// It did not name TikTok. A privacy policy that omits a recipient of the visitor's
// data is not an incomplete document — it is an inaccurate one, and it is the
// document the site points to when it asks for consent. The pixel was added and
// the policy was not re-read, which is the same class of miss as the manifest
// still selling a deleted product: a change landed in the code and not in the
// surface that describes the code.
//
// THE SOURCE OF TRUTH IS THE CSP, deliberately. next.config.js is the definitive
// list of hosts this site's browser code is ALLOWED to reach — a vendor that is
// not there cannot receive anything, and a vendor that is there can. Deriving the
// expectation from it means the policy is checked against what the site can
// actually do, not against a second list that would drift the same way the first
// one did.
describe("no third-party data recipient is undisclosed", () => {
  const csp = readFileSync("next.config.js", "utf8");
  // Whitespace-normalised, because this reads SOURCE and JSX wraps prose wherever
  // the line ran long: the policy renders "Google Analytics 4" but the file holds
  // "Google\n          Analytics 4". Matching the raw source would fail on a
  // reformat and pass on a deletion — exactly backwards.
  const privacy = readFileSync("app/legal/privacy/page.tsx", "utf8").replace(/\s+/g, " ");

  /** host fragment in the CSP → the name a visitor must be able to read. */
  const VENDORS: { host: string; mustAppear: string[] }[] = [
    { host: "googletagmanager.com", mustAppear: ["Google Analytics 4", "Google Ads"] },
    { host: "connect.facebook.net", mustAppear: ["Meta Pixel"] },
    { host: "analytics.tiktok.com", mustAppear: ["TikTok"] },
  ];

  // vercel.live is NOT here on purpose: it is the staff preview toolbar
  // (components/StaffToolbar.tsx), it never loads for a public visitor, and
  // listing it would tell buyers their data goes somewhere it does not.
  it("the CSP scan is alive", () => {
    expect(csp).toContain("Content-Security-Policy");
    for (const v of VENDORS) {
      expect(csp, `${v.host} is no longer in the CSP — is the vendor gone?`).toContain(v.host);
    }
  });

  for (const v of VENDORS) {
    it(`${v.host} is disclosed by name`, () => {
      for (const name of v.mustAppear) {
        expect(
          privacy,
          `next.config.js lets the browser reach ${v.host}, and ` +
            `app/legal/privacy/page.tsx never says "${name}". A recipient the policy ` +
            `does not name is a recipient the visitor did not agree to. Add it to the ` +
            `pixels list in §1, or take the host out of the CSP.`,
        ).toContain(name);
      }
    });
  }

  it("Vercel Web Analytics runs without consent, and says so", () => {
    // The one measurement outside the banner. That is defensible — it stores and
    // reads nothing on the device — but only while the policy states it plainly.
    // If the disclosure is ever deleted, the un-gated script must go with it.
    const layout = readFileSync("app/layout.tsx", "utf8");
    expect(layout, "VercelAnalytics is not mounted").toContain("<VercelAnalytics />");
    expect(
      privacy,
      "app/layout.tsx mounts Vercel Web Analytics OUTSIDE the consent gate, and the " +
        "privacy policy does not name it. Un-gated measurement is only defensible " +
        "while it is disclosed — say so in §5, or move the script behind the banner.",
    ).toContain("Vercel Web Analytics");
    expect(privacy, "the policy must state that it runs without consent").toMatch(/גם ללא הסכמה/);
  });

  it("Vercel Web Analytics needs no third-party host — and must not add one", () => {
    // Both endpoints are same-origin (Vercel proxies them at the edge), so
    // `'self'` already covers them. Asserted so that a future "let's just add the
    // host to be safe" is a conscious change: every extra host in script-src is a
    // permanent widening of the policy, and this one buys nothing.
    const component = readFileSync("components/VercelAnalytics.tsx", "utf8");
    expect(component).toContain("/_vercel/insights/script.js");
    expect(component, "the analytics script must stay same-origin").not.toMatch(
      /src=\{?["'`]https?:\/\//,
    );
    expect(csp, "a Vercel analytics host was added to the CSP but is not needed").not.toContain(
      "vercel-insights.com",
    );
    expect(csp).not.toContain("va.vercel-scripts.com");
  });
});
