// test/businessPersonalSeparation.test.ts — the business and the owner's private
// accounts stay separate IN PUBLIC.
//
// THE DECISION THIS FILE ENFORCES (owner, 2026-09-01): the personal Facebook /
// Instagram / TikTok accounts work the campaign FROM BEHIND THE SCENES — they may
// post, they may run ads, they may send traffic here — but MiaMe.co.il must carry
// no visible mention and no visible link to them, and must make no machine-readable
// claim that they and the business are one entity.
//
// WHY THIS IS A GATE AND NOT A COMMENT. The link had already been built, and it was
// built for a good reason: `sameAs` plus rel="me" is the strongest identity signal
// available to a brand with no Wikipedia entry and no press. That argument is still
// true — and it is exactly why this will look like an improvement to the next person
// who reads the SEO literature and adds it back. So the reversal is written down as
// a rule with teeth rather than as a preference someone can out-argue.
//
// TWO HALVES, AND BOTH HAD TO GO. The footer links were the human half; `sameAs` on
// the Organization node was the machine half. Removing only the visible links would
// have left the claim standing in the JSON-LD, where it is invisible to the owner
// and perfectly legible to Google — the worst of the two states, because it looks
// resolved and is not.
//
// WHAT THIS FILE DOES *NOT* FORBID: measurement. The pixels are behind-the-scenes
// infrastructure — a pixel id belongs to an ad account, names no profile, and
// publishes no association. Those endpoints are allow-listed by host below, and the
// TikTok tag's own tests live at the bottom of this file.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

/** Everything that is served to, or rendered for, a visitor — plus the corpus
 *  migrations, because a knowledge row is read out to a buyer just as surely as
 *  a footer link is shown to one. */
const SURFACES = ["app", "brain", "components", "lib", "public", "styles", "supabase/migrations"];
const TEXT = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".html", ".txt", ".json", ".sql", ".md", ".xml"]);

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (TEXT.has(extname(p))) out.push(p);
  }
  return out;
}

const FILES = SURFACES.flatMap((d) => walk(d));

/** Any URL on the three consumer-social platforms. */
const SOCIAL_URL = /https?:\/\/[a-z0-9.-]*(?:facebook|instagram|tiktok)\.[a-z]+[^\s"'`)\\]*/gi;

/**
 * The ONLY permitted uses of those domains: tag delivery and beacons. Each names a
 * pixel endpoint, not a person — that is the whole distinction this file draws.
 * Adding to this list is a decision about what the site talks to, so it is made
 * here, in the open, and never by widening a regex somewhere else.
 */
const PIXEL_ENDPOINTS = [
  "connect.facebook.net", //   Meta pixel SDK
  "analytics.tiktok.com", //   TikTok pixel SDK
  "www.facebook.com/tr", //    Meta <noscript> beacon
];
const isPixelEndpoint = (u: string) => PIXEL_ENDPOINTS.some((h) => u.includes(h));

describe("no public link between MiaMe and the owner's private accounts", () => {
  it("scans a surface set that is actually populated", () => {
    // A guard pointed at nothing passes forever. This is the mutation-proofing for
    // the two tests below: if the walk breaks, they go green while enforcing zero.
    expect(FILES.length, "the surface walk found no files — the guard below is vacuous").toBeGreaterThan(50);
    expect(FILES.some((f) => f.startsWith("components/"))).toBe(true);
    expect(FILES.some((f) => f.startsWith("supabase/migrations"))).toBe(true);
  });

  it("no social PROFILE url appears on any surface — only pixel endpoints", () => {
    const offenders: string[] = [];
    for (const f of FILES) {
      for (const u of readFileSync(f, "utf8").match(SOCIAL_URL) ?? []) {
        if (!isPixelEndpoint(u)) offenders.push(`${f}: ${u}`);
      }
    }
    expect(
      offenders,
      "a social profile url is published on a visitor-facing surface.\n" +
        "  If this is the owner's PERSONAL account: it must not be here — the business\n" +
        "  and the private accounts stay separate in public, by standing instruction.\n" +
        "  If this is a BRAND account: that is a different decision and a legitimate\n" +
        "  one, but make it deliberately by adding it here, not by slipping a url past\n" +
        "  a guard that exists to make the question get asked.\n" +
        `  Found:\n    ${offenders.join("\n    ")}`,
    ).toEqual([]);
  });

  it('makes no `sameAs` claim and uses no rel="me"', () => {
    // Both are assertions of IDENTITY — "the account over there is this business".
    // They are the two mechanisms by which the separation would be undone silently,
    // because neither is visible on the page: `sameAs` lives in JSON-LD and rel="me"
    // is an attribute. The url scan above cannot catch them on its own, since either
    // could be added pointing at a url built at runtime.
    const code = FILES.filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));
    for (const f of code) {
      const src = readFileSync(f, "utf8");
      expect(src, `${f} emits rel="me" — the identity relation, which claims the linked account IS this site`)
        .not.toMatch(/rel=["'`][^"'`]*\bme\b/);
      expect(src, `${f} declares sameAs — the machine-readable claim that another profile is this same entity`)
        .not.toMatch(/\bsameAs\b\s*:/);
    }
  });
});

describe("measurement is unaffected — it names no one", () => {
  // The separation is about published identity, not about analytics. A pixel id
  // belongs to an ad account and reveals no profile, so the campaign can still be
  // measured end to end while the accounts stay unlinked.
  const scripts = readFileSync("components/MarketingScripts.tsx", "utf8");

  it("the TikTok pixel is env-gated and consent-revoked at boot, like every other tag", () => {
    expect(scripts).toContain("hasTikTokPixel");
    // Booting with cookies enabled would make the consent banner decorative:
    // the tag would already be measuring before anyone agreed to anything.
    expect(scripts, "the TikTok tag boots without disabling cookies").toContain("ttq.disableCookie()");
  });

  it("is documented in the env contract", () => {
    // The VOYAGE_API_KEY lesson: a variable the code reads and .env.example does
    // not mention is a variable the operator cannot know to set.
    expect(readFileSync(".env.example", "utf8")).toContain("NEXT_PUBLIC_TIKTOK_PIXEL_ID");
  });
});
