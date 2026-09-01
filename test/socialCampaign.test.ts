// test/socialCampaign.test.ts — the links FROM the networks land somewhere real.
//
// This is a one-way design and the tests mirror it. Traffic flows IN: the profiles
// point at MiaMe.co.il. Identity does not flow OUT — that half is enforced by
// test/businessPersonalSeparation.test.ts, and the reason no profile URL appears in
// lib/social-campaign.ts is that the guard there would fail the build if one did.
//
// THE FAILURE THIS FILE EXISTS FOR IS A DEAD LINK IN A BIO. A bio link cannot be
// hot-fixed the way a page can: it is pasted into three profiles, it is what every
// post drives at, and when it 404s nobody reports it — the visitor simply leaves.
// It already happened here: the hub's PRIMARY call to action shipped pointing at
// "/#simulator", an anchor that exists nowhere on the site. The homepage would have
// loaded at the top and the one action the page exists to produce would have been
// silently unreachable. The site's actual anchor is "#sim", used in nine places.
// That is what the route/anchor check below catches.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  HUB_DESTINATIONS,
  HUB_PATH,
  SOCIAL_CHANNELS,
  bioLink,
  channelFor,
  DEFAULT_CHANNEL,
} from "../lib/social-campaign";

const ORIGIN = "https://www.miame.co.il";

/** Every route the App Router actually serves, with (groups) stripped. */
function routes(dir = "app", prefix = ""): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      // "(seo)" is a route GROUP — it organises files and contributes no URL segment.
      const seg = name.startsWith("(") && name.endsWith(")") ? "" : `/${name}`;
      out.push(...routes(p, prefix + seg));
    } else if (name === "page.tsx") {
      out.push(prefix || "/");
    }
  }
  return out;
}
const ROUTES = new Set(routes());

/** Every `id="..."` the tree renders — the set an in-page anchor can land on. */
function anchorsIn(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return anchorsIn(p);
    if (!/\.tsx?$/.test(n)) return [];
    return [...readFileSync(p, "utf8").matchAll(/id="([a-zA-Z0-9-]+)"/g)].map((m) => m[1]);
  });
}
const ANCHORS = new Set(["app", "components"].flatMap(anchorsIn));

describe("the destination the profiles point at is real", () => {
  it("the route scan found the app — otherwise every check below is vacuous", () => {
    expect(ROUTES.size, "no routes discovered").toBeGreaterThan(8);
    expect(ROUTES.has(HUB_PATH), `the hub route ${HUB_PATH} does not exist`).toBe(true);
    expect(ANCHORS.size, "no anchors discovered").toBeGreaterThan(20);
  });

  it("every hub destination resolves to a page that exists, and an anchor that exists", () => {
    for (const d of HUB_DESTINATIONS) {
      expect(d.href.startsWith("/"), `${d.label} leaves the site: ${d.href}`).toBe(true);
      const [path, hash] = d.href.split("#");
      const route = path === "/" || path === "" ? "/" : path.replace(/\/$/, "");
      expect(ROUTES.has(route), `${d.label} points at ${route}, which is not a route`).toBe(true);
      if (hash)
        expect(ANCHORS.has(hash), `${d.label} points at #${hash}, which no element renders`).toBe(true);
    }
  });

  it("exactly one destination is the primary action", () => {
    // Two primaries is no primary: the page stops telling the visitor what to do.
    expect(HUB_DESTINATIONS.filter((d) => d.primary)).toHaveLength(1);
  });
});

describe("each network is attributable, and none of them is guessed", () => {
  it("every bio link is same-origin and lands on the hub", () => {
    for (const c of SOCIAL_CHANNELS) {
      const u = new URL(bioLink(c, ORIGIN));
      expect(u.origin, `${c.key}: a bio link that leaves the domain spends the click`).toBe(ORIGIN);
      expect(u.pathname).toBe(HUB_PATH);
    }
  });

  it("every bio link is tagged, and its source is the channel itself", () => {
    // Without utm_source the three networks are indistinguishable in every report,
    // and the whole reason one hub can serve three channels disappears.
    const sources = new Set<string>();
    for (const c of SOCIAL_CHANNELS) {
      const q = new URL(bioLink(c, ORIGIN)).searchParams;
      expect(q.get("utm_source"), `${c.key}: source must be the channel key`).toBe(c.key);
      expect(q.get("utm_medium")).toBe("bio");
      expect(q.get("utm_campaign")).toBeTruthy();
      sources.add(q.get("utm_source")!);
    }
    expect(sources.size, "two channels share a utm_source — their traffic merges").toBe(
      SOCIAL_CHANNELS.length,
    );
  });

  it("an unknown or absent source falls back instead of guessing", () => {
    // A visitor with a stripped query string gets neutral copy. Greeting them with
    // the wrong network is worse than greeting them with none.
    for (const c of SOCIAL_CHANNELS) expect(channelFor(c.key).key).toBe(c.key);
    expect(channelFor("FACEBOOK").key, "source matching must be case-insensitive").toBe("facebook");
    for (const bad of [undefined, "", "  ", "twitter", "../x"])
      expect(channelFor(bad).headline).toBe(DEFAULT_CHANNEL.headline);
  });

  it("the bio text fits the tightest platform limit", () => {
    // TikTok caps a bio at 80 characters. One string has to work on all three, so
    // the cap that binds is the smallest one — checked here rather than discovered
    // by a truncated bio on the live profile.
    for (const c of SOCIAL_CHANNELS)
      expect(c.bio.length, `${c.key}: bio is ${c.bio.length} chars, TikTok truncates at 80`).toBeLessThanOrEqual(80);
  });
});

describe("the hub routes traffic without competing for it", () => {
  const src = readFileSync("app/link/page.tsx", "utf8");

  it("is noindex — it must never win a query one of our real pages could", () => {
    expect(src).toMatch(/index:\s*false/);
  });

  it("is FOLLOW — the half that makes the incoming links worth anything", () => {
    // `follow` is what lets equity arriving from the profiles pass THROUGH the hub
    // into the pages that should rank. `nofollow` here would absorb it silently:
    // the page would look correct and the links would buy nothing.
    expect(src, "the hub stopped passing link equity to the real pages").toMatch(/follow:\s*true/);
  });

  it("declares its own share card rather than inheriting the homepage's", () => {
    // A hub travels by being pasted. Without its own openGraph it announces the
    // homepage's title AND og:url, so the preview describes a different page.
    expect(src).toMatch(/openGraph/);
    expect(src).toMatch(/url:\s*"\/link"/);
  });
});

describe("the operator kit cannot go stale", () => {
  // docs/social-launch-kit.md is what actually gets pasted into three profiles. A doc
  // that repeats a URL is a doc that drifts from it — and the drift is invisible,
  // because a wrong-but-plausible link still loads a page. So the doc is checked
  // against the generator rather than trusted: change bioLink() without regenerating
  // the kit and CI stops it here.
  const kit = readFileSync("docs/social-launch-kit.md", "utf8");
  const SITE = "https://www.miame.co.il";

  it("quotes exactly the links the code produces, for every channel", () => {
    for (const c of SOCIAL_CHANNELS) {
      const want = bioLink(c, SITE);
      expect(kit, `the kit does not carry ${c.key}'s real link (${want})`).toContain(want);
    }
  });

  it("quotes the bio text verbatim, and states what is still manual", () => {
    for (const c of SOCIAL_CHANNELS)
      expect(kit, `${c.key}'s bio text in the kit does not match the source`).toContain(c.bio);
    // The one thing the kit must never imply is that the accounts get set up here.
    expect(kit).toMatch(/אין קונקטור/);
  });

  it("names both generated assets at the sizes the routes declare", () => {
    for (const [route, file] of [
      ["/social/avatar", "app/social/avatar/route.tsx"],
      ["/social/cover", "app/social/cover/route.tsx"],
    ]) {
      const src = readFileSync(file, "utf8");
      const m = src.match(/size = \{ width: (\d+), height: (\d+) \}/);
      expect(m, `${file} declares no size`).toBeTruthy();
      expect(kit, `the kit does not list ${route}`).toContain(route);
      expect(kit, `the kit states the wrong size for ${route}`).toContain(`${m![1]}×${m![2]}`);
    }
  });
});
