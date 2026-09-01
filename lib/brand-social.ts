// lib/brand-social.ts — the BRAND's own profiles. The registry, and the only place
// a social profile URL may appear anywhere in this repo.
//
// ── THE DISTINCTION THIS FILE CARRIES ────────────────────────────────────────
// There are two kinds of account, and the site treats them as opposites:
//
//   BRAND (MiaMe.co.il's own profiles)  → belong here. Claiming them is correct and
//     valuable: `sameAs` is how Google and the answer engines decide that this site
//     and those accounts are ONE entity, which is the strongest identity signal
//     available to a brand with no Wikipedia entry and no press coverage yet.
//
//   PERSONAL (the owner's own accounts)  → must NEVER appear. They work the campaign
//     from behind the scenes; the site carries no visible mention, no visible link,
//     and no machine-readable claim tying them to the business. Standing instruction.
//
// A URL cannot be told apart by its shape — instagram.com/x looks identical whoever
// owns it — so the guard cannot make that call and does not pretend to. What it CAN
// enforce, and does, is that the decision is DELIBERATE: exactly one file may name a
// profile, every consumer derives from it, and adding an entry means editing this
// file with this comment in front of you. See test/businessPersonalSeparation.test.ts.
//
// ── WHY CANONICAL URLS ONLY ──────────────────────────────────────────────────
// No tracking parameters and no /share/ links. A share sheet mints a per-share,
// per-device token, and a /share/ path is a redirector that names no profile. In
// `sameAs` those are worse than useless: a crawler resolves identity from the URL it
// is handed, so a one-time token claims an identity that does not exist. It renders
// fine, it validates fine, and it does nothing. Take the address from the profile's
// own page — the one the platform itself calls canonical.

export interface BrandProfile {
  /** Stable key — also the analytics placement, so a click can be attributed. */
  key: "instagram" | "tiktok" | "facebook";
  /** Shown to a visitor. */
  label: string;
  /** CANONICAL profile URL. No query string, no fragment, no /share/. */
  url: string;
}

/**
 * EMPTY UNTIL THE CANONICAL URLS ARE SUPPLIED — and empty is a valid, honest state:
 * schema.org reads an absent `sameAs` as "not stated", while a `sameAs` pointing at
 * the wrong profile is a claim, and a false one. A wrong identity in the entity graph
 * is far harder to undo than a missing one, so the URLs are never guessed from a
 * handle, a search result, or a share link.
 *
 * Adding one is a single object:
 *   { key: "instagram", label: "Instagram", url: "https://www.instagram.com/<handle>" }
 */
export const BRAND_PROFILES: BrandProfile[] = [
  // The brand's Instagram page, opened 2026-09-01. Registered here on the owner's
  // word that it is the BRAND account — that call is his and no check substitutes
  // for it; what this file guarantees is that the call was made deliberately and
  // that the address is canonical.
  //
  // The URL arrived as `?igsi=YXVqNno0amw2YWN5`. Stripped, once, here: that is a
  // per-share, per-device token, and a `sameAs` carrying one claims an identity
  // that does not exist. It would render fine, validate fine, and do nothing.
  {
    key: "instagram",
    label: "Instagram",
    url: "https://www.instagram.com/jointezme",
  },
];

/** The `sameAs` array for the Organization node. Omitted entirely when empty. */
export const SAME_AS: string[] = BRAND_PROFILES.map((p) => p.url);
