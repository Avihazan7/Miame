// lib/utm.ts — first-touch attribution for the MiaMe demand funnel.
//
// Captures UTM parameters (+ Google/Meta click ids) from the landing URL and
// persists them for the whole session, so every lead, WhatsApp message and
// analytics event carries the campaign that produced it — even after the visitor
// browses to other sections. First-touch wins: the original source is never
// overwritten by a later internal navigation. All browser-only and wrapped in
// try/catch, so it can never break the funnel or SSR.

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

    window.localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch {
    return getUtm();
  }
}

/** Read the persisted attribution (never throws; returns {} when unset). */
export function getUtm(): Utm {
  if (typeof window === "undefined") return {};
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
