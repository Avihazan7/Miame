// lib/social-campaign.ts — the ONE-WAY relationship between the networks and the site.
//
// DIRECTION MATTERS, AND IT IS THE WHOLE DESIGN. Traffic flows IN: the profiles link
// to MiaMe.co.il. Identity does NOT flow OUT: the site never names, links or claims
// those accounts (test/businessPersonalSeparation.test.ts enforces that, and it is
// why you will not find a single profile URL in this file — there is nothing here but
// OUR urls and OUR copy).
//
// WHY ONE HUB AND NOT THREE LANDING PAGES. Three near-identical pages — same product,
// same price, same CTA, differing only in which network sent the visitor — are the
// textbook definition of doorway pages. They compete with the real pages for the same
// Hebrew keywords, split authority across three thin URLs, and are explicitly against
// Google's guidelines. And they buy nothing: per-network ATTRIBUTION does not come
// from having a page per network, it comes from UTM, which lib/utm.ts already captures
// first-touch across the whole session.
//
// So: one hub, three tagged links into it. The hub is `noindex, follow` — its job is
// to route a visitor, not to rank, and `follow` is the load-bearing half: link equity
// arriving from the networks passes THROUGH the hub into the pages that should rank.
// An indexable hub would compete with them; a `nofollow` one would absorb the value.
//
// WHAT DIFFERS PER NETWORK IS THE MESSAGE, NOT THE PAGE. A visitor arriving from a
// short video already saw the machine move; one arriving from a Facebook post is
// likelier to be researching on behalf of a parent, where the entitlement routes
// matter more than the spec. That is real differentiation, and it costs one headline —
// not three URLs.

/** Where a bio link lands. Same-origin, always — see `assertOwnPath` in the test. */
export const HUB_PATH = "/link";

export interface SocialChannel {
  /** utm_source, and the hub's lookup key. Lowercase, stable, analytics-visible. */
  key: "facebook" | "instagram" | "tiktok";
  /** For the operator's kit only — never rendered on the site. */
  label: string;
  /** The hub headline for visitors from this network. */
  headline: string;
  /** One line under it. Same promise, phrased for how they arrived. */
  sub: string;
  /** Bio text to paste into the profile. Kept under the platform's tightest
   *  limit (TikTok is 80 characters) so one string works everywhere. */
  bio: string;
}

export const SOCIAL_CHANNELS: SocialChannel[] = [
  {
    key: "instagram",
    label: "Instagram",
    headline: "הגעתם מאינסטגרם",
    sub: "מיה פור · ניידות חשמלית פרימיום. הצעת תשלום מותאמת תוך דקה, ישירות לוואטסאפ.",
    bio: "מיה פור · ניידות חשמלית פרימיום. הצעה תוך דקה 👇",
  },
  {
    key: "tiktok",
    label: "TikTok",
    headline: "ראיתם את זה בסרטון",
    sub: "אותה מיה פור, עם המספרים: מחיר, טווח, ותשלום חודשי משוער תוך דקה.",
    bio: "מיה פור · מהסרטון למחיר אמיתי, תוך דקה 👇",
  },
  {
    key: "facebook",
    label: "Facebook",
    headline: "ברוכים הבאים מפייסבוק",
    sub: "מיה פור · ניידות חשמלית פרימיום, כולל מסלולי זכאות לנכי צה״ל ולמשפחות שכולות.",
    bio: "מיה פור · ניידות חשמלית פרימיום. פרטים ומחיר 👇",
  },
];

export const DEFAULT_CHANNEL: SocialChannel = {
  key: "instagram",
  label: "—",
  headline: "מיה פור · MiaMe",
  sub: "ניידות חשמלית פרימיום במחיר חכם. הצעת תשלום מותאמת תוך דקה, ישירות לוואטסאפ.",
  bio: "",
};

export function channelFor(source: string | undefined): SocialChannel {
  const k = (source ?? "").toLowerCase().trim();
  return SOCIAL_CHANNELS.find((c) => c.key === k) ?? DEFAULT_CHANNEL;
}

/**
 * The URL pasted into a profile's bio. One campaign across all three so the
 * networks can be compared against each other in one report; `medium=bio`
 * separates the profile link from anything paid that may run later.
 */
export function bioLink(channel: SocialChannel, origin: string): string {
  const u = new URL(HUB_PATH, origin);
  u.searchParams.set("utm_source", channel.key);
  u.searchParams.set("utm_medium", "bio");
  u.searchParams.set("utm_campaign", "launch");
  return u.toString();
}

export interface HubDestination {
  href: string;
  label: string;
  note: string;
  /** The one action the page exists to produce. Exactly one may be primary. */
  primary?: boolean;
}

/**
 * Where the hub sends people. Ordered by what a visitor from a social post
 * actually wants, not by site hierarchy: the price question first, because it is
 * the one they came with, and the entitlement routes last because the people who
 * need them will look for them.
 *
 * Every href is root-relative — a hub that sends traffic off-domain would be
 * spending the link it was built to earn.
 */
export const HUB_DESTINATIONS: HubDestination[] = [
  { href: "/#sim", label: "בנו הצעת תשלום", note: "עד 18 תשלומים · תוצאה תוך דקה", primary: true },
  { href: "/mia-four", label: "מיה פור · הדגמים והמחירים", note: "2×4 City · 2×4 City Long Range · 4×4 Pro Max" },
  { href: "/klnoit-shetach", label: "קלנועית שטח 4×4", note: "ארבעה מנועים · הנעה כפולה" },
  { href: "/klnoit-mitkapelet", label: "קלנועית מתקפלת", note: "נכנסת לרכב · סוללה נשלפת" },
  { href: "/eligibility", label: "מסלולי זכאות", note: "נכי צה״ל ומשפחות שכולות" },
];
