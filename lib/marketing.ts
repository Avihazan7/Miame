// lib/marketing.ts — provider-agnostic marketing pixels for the MiaMe funnel.
//
// GA4 + Google Ads + Meta Pixel, all env-gated: when the corresponding
// NEXT_PUBLIC_ id is absent the helpers are pure no-ops, so the current
// deployment is byte-for-byte unchanged and each channel "lights up" the moment
// its id is set in Vercel (same pattern as NEXT_PUBLIC_MIA_GLB_URL). Nothing here
// ever throws — marketing must never block or break the experience.

import { getUtm } from "./utm";

export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID || "";
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "";
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

// Google Ads conversion labels (the part after "AW-XXXX/"). Optional — set them
// to count a lead / WhatsApp click as a conversion action in Google Ads.
export const ADS_LEAD_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL || "";
export const ADS_WHATSAPP_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_LABEL || "";

export const hasGa4 = Boolean(GA4_ID);
export const hasGoogleAds = Boolean(GOOGLE_ADS_ID);
export const hasMetaPixel = Boolean(META_PIXEL_ID);
/** Any pixel configured → we should render the consent banner + tag scripts. */
export const marketingEnabled = hasGa4 || hasGoogleAds || hasMetaPixel;

type Params = Record<string, unknown>;

interface Gtag {
  (...args: unknown[]): void;
}
interface Fbq {
  (...args: unknown[]): void;
}

function gtag(): Gtag | null {
  if (typeof window === "undefined") return null;
  const g = (window as unknown as { gtag?: Gtag }).gtag;
  return typeof g === "function" ? g : null;
}

function fbq(): Fbq | null {
  if (typeof window === "undefined") return null;
  const f = (window as unknown as { fbq?: Fbq }).fbq;
  return typeof f === "function" ? f : null;
}

/** Fire a GA4 event (no-op unless GA4 is configured and loaded). */
export function ga4Event(name: string, params: Params = {}): void {
  try {
    const g = gtag();
    if (!g || !hasGa4) return;
    g("event", name, { ...getUtm(), ...params });
  } catch {
    /* marketing never throws */
  }
}

/** Fire a Meta Pixel standard/custom event (no-op unless the Pixel is configured). */
export function metaEvent(name: string, params: Params = {}, standard = true): void {
  try {
    const f = fbq();
    if (!f || !hasMetaPixel) return;
    f(standard ? "track" : "trackCustom", name, params);
  } catch {
    /* marketing never throws */
  }
}

/** Register a Google Ads conversion (no-op unless an Ads id + label are set). */
export function adsConversion(label: string, params: Params = {}): void {
  try {
    const g = gtag();
    if (!g || !hasGoogleAds || !label) return;
    g("event", "conversion", { send_to: `${GOOGLE_ADS_ID}/${label}`, ...params });
  } catch {
    /* marketing never throws */
  }
}

// ── Consent Mode v2 (Google) ─────────────────────────────────────────────────
// We default consent to "denied" in the tag bootstrap and grant it here once the
// visitor accepts. When no pixel is configured this is never reached.
const CONSENT_KEY = "miame_consent";

export function readConsent(): "granted" | "denied" | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(state: "granted" | "denied"): void {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(CONSENT_KEY, state);
    const g = gtag();
    if (g) {
      g("consent", "update", {
        ad_storage: state,
        analytics_storage: state,
        ad_user_data: state,
        ad_personalization: state
      });
    }
    const f = fbq();
    if (f) f("consent", state === "granted" ? "grant" : "revoke");
  } catch {
    /* marketing never throws */
  }
}
