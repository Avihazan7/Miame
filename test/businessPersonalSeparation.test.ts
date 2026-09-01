// test/businessPersonalSeparation.test.ts — one registry decides which accounts the
// site claims, and the owner's personal ones are never among them.
//
// ── TWO KINDS OF ACCOUNT, TREATED AS OPPOSITES ───────────────────────────────
// BRAND profiles (MiaMe.co.il's own) are claimed on purpose: `sameAs` is how Google
// and the answer engines decide the site and those accounts are ONE entity, and it
// is the strongest identity signal available to a brand with no Wikipedia entry and
// no press yet. PERSONAL profiles (the owner's) are never claimed: they work the
// campaign from behind the scenes, and the site carries no visible mention, no
// visible link and no machine-readable claim tying them to the business.
//
// ── WHAT THIS FILE CAN AND CANNOT ENFORCE, STATED HONESTLY ───────────────────
// It CANNOT tell a brand account from a personal one. instagram.com/x looks identical
// whoever owns it; that call is the owner's and no regex substitutes for it. What it
// CAN enforce — and does — is that the call is DELIBERATE and CANONICAL:
//   · exactly ONE file may contain a profile URL (lib/brand-social.ts),
//   · every consumer derives from it and none types a URL,
//   · every entry is a real profile address, not a share link or a tracked one.
// So a profile reaches the entity graph only by someone editing the registry, with
// the brand/personal distinction written directly above the array they are editing.
//
// ── WHY THIS IS A GATE AND NOT A COMMENT ─────────────────────────────────────
// The personal accounts were once linked here, and for a good reason — the SEO
// argument above is genuinely true. That is exactly why the next person to read the
// literature will add them back as an improvement. The rule needs teeth, not prose.
//
// TWO HALVES, AND BOTH MATTER. Footer links are the human claim; `sameAs` is the
// machine claim. Removing only the visible links would leave the claim standing in
// the JSON-LD — invisible to the owner, perfectly legible to Google. That is the
// worse of the two states, because it looks resolved and is not.
//
// NOT FORBIDDEN: measurement. A pixel id belongs to an ad account, names no profile
// and publishes no association, so those endpoints are allow-listed by host below.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { BRAND_PROFILES, SAME_AS } from "../lib/brand-social";

/** Everything served to, or rendered for, a visitor — plus the corpus migrations,
 *  because a knowledge row is read out to a buyer as surely as a footer link is
 *  shown to one. */
const SURFACES = ["app", "brain", "components", "lib", "public", "styles", "supabase/migrations"];
const TEXT = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".html", ".txt", ".json", ".sql", ".md", ".xml"]);

/** The ONE file allowed to name a profile. Everything else derives from it. */
const REGISTRY = join("lib", "brand-social.ts");

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
 * The only permitted uses of those domains outside the registry: tag delivery and
 * beacons. Each names a pixel endpoint, not a person — that is the distinction.
 * Adding to this list is a decision about what the site talks to, made here in the
 * open and never by widening a regex somewhere else.
 */
const PIXEL_ENDPOINTS = [
  "connect.facebook.net", //   Meta pixel SDK
  "analytics.tiktok.com", //   TikTok pixel SDK
  "www.facebook.com/tr", //    Meta <noscript> beacon
];
const isPixelEndpoint = (u: string) => PIXEL_ENDPOINTS.some((h) => u.includes(h));

describe("one registry decides which accounts the site claims", () => {
  it("scans a surface set that is actually populated", () => {
    // A guard pointed at nothing passes forever — this is what stops the rest of
    // this file from silently enforcing zero.
    expect(FILES.length, "the surface walk found no files — the guard below is vacuous").toBeGreaterThan(50);
    expect(FILES).toContain(REGISTRY);
    expect(FILES.some((f) => f.startsWith("components/"))).toBe(true);
    expect(FILES.some((f) => f.startsWith("supabase/migrations"))).toBe(true);
  });

  it("no file but the registry names a social profile", () => {
    const offenders: string[] = [];
    for (const f of FILES) {
      if (f === REGISTRY) continue;
      for (const u of readFileSync(f, "utf8").match(SOCIAL_URL) ?? []) {
        if (!isPixelEndpoint(u)) offenders.push(`${f}: ${u}`);
      }
    }
    expect(
      offenders,
      "a social profile url appears outside lib/brand-social.ts.\n" +
        "  Every consumer must DERIVE from the registry — a URL typed into a page is a\n" +
        "  claim made without the brand/personal decision in front of the person making\n" +
        "  it, which is the exact mistake the registry exists to prevent.\n" +
        `  Found:\n    ${offenders.join("\n    ")}`,
    ).toEqual([]);
  });

  it("every registry entry is a canonical profile address", () => {
    for (const p of BRAND_PROFILES) {
      const u = new URL(p.url);
      expect(u.protocol, `${p.key}: not https`).toBe("https:");
      // A share sheet mints a per-share, per-device token. A crawler resolves
      // identity from the URL it is handed, so a one-time token in `sameAs` claims
      // an identity that does not exist — it validates fine and does nothing.
      expect(u.search, `${p.key} carries a tracking parameter: ${u.search}`).toBe("");
      expect(u.hash, `${p.key} carries a fragment`).toBe("");
      expect(p.url, `${p.key}: a trailing slash makes two URLs for one profile`).not.toMatch(/\/$/);
      // /share/ and /s/ are redirectors: they name no profile at all.
      expect(p.url, `${p.key} is a redirector, not a profile address`).not.toMatch(/\/(share|s)\//);
    }
  });

  it("one entry per platform", () => {
    const keys = BRAND_PROFILES.map((p) => p.key);
    expect(new Set(keys).size, `duplicate platform: ${keys.join(", ")}`).toBe(keys.length);
  });

  it("sameAs carries exactly the registry, in order", () => {
    expect(SAME_AS).toEqual(BRAND_PROFILES.map((p) => p.url));
  });

  it("the layout derives its claim and is the only place that makes one", () => {
    // The guard that matters: the registry being right buys nothing if the consumer
    // stops reading it. Source-level, because the JSON-LD is emitted at render.
    const layout = readFileSync("app/layout.tsx", "utf8");
    expect(layout, "the layout no longer reads the registry").toContain("SAME_AS");

    // `sameAs` anywhere else would be a second claim, made outside the registry.
    const elsewhere = FILES.filter(
      (f) => (f.endsWith(".ts") || f.endsWith(".tsx")) && f !== "app/layout.tsx" && f !== REGISTRY,
    ).filter((f) => /\bsameAs\b\s*:/.test(readFileSync(f, "utf8")));
    expect(elsewhere, `sameAs is declared outside the layout: ${elsewhere.join(", ")}`).toEqual([]);
  });

  it('rel="me" appears only where the registry is being rendered', () => {
    // rel="me" is the identity relation — the human-visible half of the claim
    // `sameAs` makes. Hand-rolling it on a link is how a profile gets claimed
    // without going through the registry at all.
    const bad = FILES.filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))
      .filter((f) => /rel=["'`][^"'`]*\bme\b/.test(readFileSync(f, "utf8")))
      .filter((f) => !readFileSync(f, "utf8").includes("brand-social"));
    expect(bad, `rel="me" without reading the registry: ${bad.join(", ")}`).toEqual([]);
  });
});

describe("measurement is unaffected — it names no one", () => {
  const scripts = readFileSync("components/MarketingScripts.tsx", "utf8");

  it("the TikTok pixel is env-gated and consent-revoked at boot, like every other tag", () => {
    expect(scripts).toContain("hasTikTokPixel");
    // Booting with cookies enabled would make the consent banner decorative: the
    // tag would already be measuring before anyone agreed to anything.
    expect(scripts, "the TikTok tag boots without disabling cookies").toContain("ttq.disableCookie()");
  });

  it("is documented in the env contract", () => {
    // The VOYAGE_API_KEY lesson: a variable the code reads and .env.example does
    // not mention is a variable the operator cannot know to set.
    expect(readFileSync(".env.example", "utf8")).toContain("NEXT_PUBLIC_TIKTOK_PIXEL_ID");
  });
});
