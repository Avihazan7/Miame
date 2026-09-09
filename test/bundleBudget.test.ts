// test/bundleBudget.test.ts — what the visitor downloads before anything works.
//
// MEASURED 2026-09-09 on a fresh production build. `lib/analytics.ts` opened with
// a static `import { supabase } from "./supabase"`, and `components/Configurator.tsx`
// with a static `import { saveLead } from "@/lib/supabase"`. Because `track` is
// imported by 13 client components — Hero (the LCP element) and Header among them
// — that put the ENTIRE @supabase/supabase-js SDK into the initial script set of
// / and of all four SEO landing pages:
//
//     static/chunks/445-*.js         175,482 B raw / 48,269 B gz
//     static/chunks/44530001-*.js     62,501 B raw / 13,276 B gz
//
// Those chunks are auth-js, realtime-js (a phoenix websocket client), storage-js,
// postgrest and a Node Buffer shim. The page uses none of it. `createClient()` ran
// at module scope, so every load also booted GoTrue with persistSession,
// detectSessionInUrl and autoRefreshToken all true — reading localStorage, parsing
// the URL for an auth fragment and arming a refresh timer, on a site with no login,
// inside the hydration window, competing with the LCP image preload.
//
// After making both imports dynamic:  /  192 kB → 137 kB First Load JS,
//                                     SEO landings 181 kB → 120 kB.
//
// The cheapest way to undo that is for someone to add `import { track }` beside a
// static supabase import again, so the assertion is on the BUILT MANIFEST rather
// than on the source: it fails on the fact, not on the phrasing.
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

const MANIFEST = ".next/app-build-manifest.json";
const hasBuild = existsSync(MANIFEST);

/** Chunk contents that only the Supabase SDK produces. */
const SDK = /supabase-js|RealtimeClient|AuthPKCECodeVerifier|createClient\(/;

describe.skipIf(!hasBuild)("the Supabase SDK stays out of the initial script set", () => {
  const manifest = hasBuild ? JSON.parse(readFileSync(MANIFEST, "utf8")) : { pages: {} };

  /** Initial chunks for a route that contain the SDK. */
  function sdkChunks(route: string): string[] {
    const files: string[] = manifest.pages[route] ?? [];
    return files.filter((f) => {
      if (!f.endsWith(".js")) return false;
      try {
        return SDK.test(readFileSync(`.next/${f}`, "utf8"));
      } catch {
        return false;
      }
    });
  }

  // The two routes the campaign buys traffic for.
  it.each(["/page", "/(seo)/klnoit-shetach/page"])(
    "%s does not ship the SDK before the visitor interacts",
    (route) => {
      expect(manifest.pages[route], `${route} is not in the build manifest`).toBeTruthy();
      expect(
        sdkChunks(route),
        `the Supabase SDK is back in the initial bundle of ${route} — ` +
          "check for a static `import ... from \"@/lib/supabase\"` in a client component",
      ).toEqual([]);
    },
  );
});

describe("the two modules that reach Supabase from the browser load it lazily", () => {
  // A source-level companion to the manifest check above, so the failure names
  // the line to fix rather than only the symptom.
  it("lib/analytics.ts imports supabase dynamically", () => {
    const src = readFileSync("lib/analytics.ts", "utf8");
    expect(src, "static supabase import is back in lib/analytics.ts").not.toMatch(
      /^import\s+\{[^}]*\bsupabase\b[^}]*\}\s+from\s+["']\.\/supabase["']/m,
    );
    expect(src).toMatch(/await import\(["']\.\/supabase["']\)/);
  });

  it("components/Configurator.tsx imports saveLead dynamically and LeadRecord as a type", () => {
    const src = readFileSync("components/Configurator.tsx", "utf8");
    expect(src, "static saveLead import is back in Configurator.tsx").not.toMatch(
      /^import\s+\{[^}]*\bsaveLead\b[^}]*\}\s+from\s+["']@\/lib\/supabase["']/m,
    );
    expect(src).toMatch(/import type \{[^}]*LeadRecord[^}]*\} from "@\/lib\/supabase"/);
    expect(src).toMatch(/import\("@\/lib\/supabase"\)/);
  });

  it("the lead is still written — the write was made lazy, not removed", () => {
    const src = readFileSync("components/Configurator.tsx", "utf8");
    expect(src).toMatch(/saveLead\(lead\)/);
  });
});
