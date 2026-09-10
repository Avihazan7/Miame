// lib/utm.ts — first-touch attribution for the MiaMe demand funnel.
//
// Captures UTM parameters (+ Google/Meta click ids) from the landing URL so every
// lead, WhatsApp message and analytics event carries the campaign that produced it —
// even after the visitor browses to other sections. First-touch wins: the original
// source is never overwritten by a later internal navigation. All browser-only and
// wrapped in try/catch, so it can never break the funnel or SSR.
//
// WRITING TO THE DEVICE IS GATED ON CONSENT; READING THE URL IS NOT.
//
// MEASURED on a production build, 2026-09-10, first load, zero interaction:
//
//   goto('/?utm_source=tiktok&gclid=ABC123&fbclid=FB999')
//   → localStorage.miame_utm = {"utm_source":"tiktok","gclid":"ABC123","fbclid":"FB999",…}
//
// gclid and fbclid are not general telemetry: they are Google's and Meta's click
// identifiers, whose entire purpose is to tie a visitor back to an ad profile. They
// were persisted to the device before any question was asked — and in the current
// configuration NO question is asked at all, because the consent banner only renders
// when a pixel id is set and none is, so the banner never appears while this write
// happens on every ad landing.
//
// The site does not need an external standard to see the problem; it states the test
// itself. app/legal/privacy/page.tsx argues that Vercel Analytics needs no consent
// precisely because "חובת ההסכמה בדין חלה על שמירה או קריאה של מידע במכשיר שלכם,
// ופעולות אלה אינן מתבצעות כאן". This write is exactly the act that sentence names.
//
// So capture is split from persistence. The in-memory copy is populated on every
// landing and is what the funnel actually reads: land → simulator → submit happens in
// one document, and the lead is built and saved BEFORE the /thank-you navigation, so
// attribution on a converting visit is unaffected. localStorage is written only once
// consent is granted, which is what buys attribution across a full reload or a later
// return visit — and that is the part that genuinely needs asking.

import { readConsent } from "@/lib/marketing";

export interface Utm {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  landing_page?: string;
  referrer?: string;
}

const KEY = "miame_utm";

const UTM_KEYS: (keyof Utm)[] = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid"
];

function clean(v: string | null): string | undefined {
  if (!v) return undefined;
  const s = v.trim().slice(0, 200);
  return s || undefined;
}

/**
 * Capture attribution from the current URL and persist it (first-touch).
 * Idempotent and safe to call on every mount. Returns the stored attribution.
 */
export function captureUtm(): Utm {
  if (typeof window === "undefined") return {};
  try {
    const stored = getUtm();
    const params = new URLSearchParams(window.location.search);

    const fresh: Utm = {};
    let sawAny = false;
    for (const k of UTM_KEYS) {
      const val = clean(params.get(k));
      if (val) {
        fresh[k] = val;
        sawAny = true;
      }
    }

    // First-touch: if we already captured attribution, keep it. Only record a
    // new touch when this landing actually carries campaign params.
    if (!sawAny && Object.keys(stored).length > 0) return stored;

    const next: Utm = {
      ...(sawAny ? {} : stored),
      ...fresh,
      landing_page: stored.landing_page || clean(window.location.pathname) || "/",
      referrer: stored.referrer || clean(document.referrer) || undefined
    };

    // Memory always: this is what the funnel reads on the visit that converts.
    memory = next;
    // Device only with consent. `persistUtm()` is called again from setConsent(), so
    // a visitor who lands on an ad and then accepts keeps the attribution they arrived
    // with rather than losing it to the order of the two events.
    persistUtm();
    return next;
  } catch {
    return getUtm();
  }
}

/**
 * The in-memory copy. Survives client-side navigation within the document, which is
 * the whole funnel; it does not survive a reload, and without consent that is the
 * intended limit rather than a bug.
 */
let memory: Utm = {};

/** Write the captured attribution to the device — only once consent is granted.
 *  Safe to call at any time; a no-op before consent and with nothing captured. */
export function persistUtm(): void {
  if (typeof window === "undefined") return;
  try {
    if (readConsent() !== "granted") return;
    if (!Object.keys(memory).length) return;
    window.localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    /* storage disabled or full — attribution is a nice-to-have, never a blocker */
  }
}

/** Read the captured attribution: memory first, then the device.
 *  Never throws; returns {} when nothing was captured. */
export function getUtm(): Utm {
  if (typeof window === "undefined") return {};
  if (Object.keys(memory).length) return memory;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Utm) : {};
  } catch {
    return {};
  }
}

/** True when we have any real campaign attribution (not just landing/referrer). */
export function hasUtm(u: Utm = getUtm()): boolean {
  return UTM_KEYS.some((k) => Boolean(u[k]));
}

/** Compact one-line source tag for CRM `source` fields / WhatsApp messages. */
export function utmTag(u: Utm = getUtm()): string {
  const parts = [u.utm_source, u.utm_medium, u.utm_campaign].filter(Boolean);
  if (u.gclid) parts.push("gclid");
  else if (u.fbclid) parts.push("fbclid");
  return parts.length ? parts.join(" / ") : "direct";
}
