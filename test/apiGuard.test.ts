import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { clientIp, guardJsonPost, honeypotTripped, originAllowed, withinRate } from "@/lib/apiGuard";

const req = (headers: Record<string, string> = {}, body?: string) =>
  new Request("https://www.miame.co.il/api/test", {
    method: "POST",
    headers,
    body: body ?? JSON.stringify({ ok: true }),
  });

describe("clientIp", () => {
  it("prefers platform headers, first hop wins", () => {
    expect(clientIp(req({ "x-vercel-forwarded-for": "1.1.1.1, 2.2.2.2" }))).toBe("1.1.1.1");
    expect(clientIp(req({ "x-real-ip": "3.3.3.3" }))).toBe("3.3.3.3");
    expect(clientIp(req({ "x-forwarded-for": "4.4.4.4" }))).toBe("4.4.4.4");
    expect(clientIp(req())).toBe("unknown");
  });
});

describe("withinRate", () => {
  it("allows up to max per window, then blocks", () => {
    expect(withinRate("t1", "a", 2)).toBe(true);
    expect(withinRate("t1", "a", 2)).toBe(true);
    expect(withinRate("t1", "a", 2)).toBe(false);
  });
  it("buckets are independent per key and per bucket", () => {
    expect(withinRate("t2", "a", 1)).toBe(true);
    expect(withinRate("t2", "b", 1)).toBe(true);
    expect(withinRate("t3", "a", 1)).toBe(true);
  });
  it("non-positive max disables the bucket", () => {
    for (let i = 0; i < 5; i++) expect(withinRate("t4", "a", 0)).toBe(true);
  });
});

describe("originAllowed", () => {
  it("passes with no Origin header (same-origin nav, curl, server-to-server)", () => {
    expect(originAllowed(req())).toBe(true);
  });
  it("passes when Origin matches the request's own host (previews included)", () => {
    expect(
      originAllowed(req({ origin: "https://preview-abc.vercel.app", host: "preview-abc.vercel.app" }))
    ).toBe(true);
  });
  it("passes for the owned storefront domains", () => {
    expect(originAllowed(req({ origin: "https://www.miame.co.il", host: "other.example" }))).toBe(true);
    expect(originAllowed(req({ origin: "https://www.leasing.co.il", host: "other.example" }))).toBe(true);
  });
  it("blocks foreign origins and malformed origins", () => {
    expect(originAllowed(req({ origin: "https://evil.example", host: "www.miame.co.il" }))).toBe(false);
    expect(originAllowed(req({ origin: "not a url", host: "www.miame.co.il" }))).toBe(false);
  });
});

describe("honeypotTripped", () => {
  it("trips only on a non-empty website field", () => {
    expect(honeypotTripped({ website: "http://spam" })).toBe(true);
    expect(honeypotTripped({ website: "  " })).toBe(false);
    expect(honeypotTripped({})).toBe(false);
    expect(honeypotTripped(null)).toBe(false);
  });
});

describe("guardJsonPost", () => {
  it("403s a foreign origin before reading the body", async () => {
    const { reject } = await guardJsonPost(req({ origin: "https://evil.example", host: "www.miame.co.il" }), {
      bucket: "g1",
      max: 100,
    });
    expect(reject?.status).toBe(403);
  });
  it("429s past the rate budget", async () => {
    const make = () => req({ "x-real-ip": "5.5.5.5" });
    expect((await guardJsonPost(make(), { bucket: "g2", max: 1 })).reject).toBeNull();
    const second = await guardJsonPost(make(), { bucket: "g2", max: 1 });
    expect(second.reject?.status).toBe(429);
  });
  it("413s an oversized body", async () => {
    const { reject } = await guardJsonPost(req({}, JSON.stringify({ pad: "x".repeat(50_000) })), {
      bucket: "g3",
      max: 100,
      maxBodyBytes: 32_000,
    });
    expect(reject?.status).toBe(413);
  });
  it("400s malformed JSON and returns the parsed body otherwise", async () => {
    const bad = await guardJsonPost(req({}, "{not json"), { bucket: "g4", max: 100 });
    expect(bad.reject?.status).toBe(400);
    const ok = await guardJsonPost(req({}, JSON.stringify({ a: 1 })), { bucket: "g5", max: 100 });
    expect(ok.reject).toBeNull();
    expect(ok.body).toEqual({ a: 1 });
  });
  it("honours the env override for max", async () => {
    process.env.RATE_LIMIT_TEST_MAX = "0";
    try {
      for (let i = 0; i < 5; i++) {
        const { reject } = await guardJsonPost(req({ "x-real-ip": "6.6.6.6" }), {
          bucket: "g6",
          max: 1,
          maxEnv: "RATE_LIMIT_TEST_MAX",
        });
        expect(reject).toBeNull();
      }
    } finally {
      delete process.env.RATE_LIMIT_TEST_MAX;
    }
  });
});

describe("the vehicle-media route runs on the least privilege that works", () => {
  // MEASURED 2026-08-31, live: RLS policy `public_read_published_vehicle_media`
  // grants SELECT on published rows to anon, and `set local role anon` returned
  // exactly the one published row. The route reads nothing else — so the service
  // key it used to demand was write-capable privilege a public GET must never
  // hold, and its absence (production's actual state) kept the media/3D API at
  // 503 for want of a key the read never needed.
  // Comments are stripped before matching: the route's own header EXPLAINS the old
  // service-key design by name, and a raw-source match would fail on the explanation
  // of the fix rather than on the fix. (The same false-green already happened twice
  // today in the other direction — see test/skipLinkTarget.test.ts.)
  const src = readFileSync("app/api/vehicles/[vehicleId]/media/route.ts", "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");

  it("never touches the service-role key", () => {
    expect(src).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("reads through the shared anon client", () => {
    expect(src).toContain('from "@/lib/supabase"');
  });

  it("keeps vendor error text out of the world-readable response", () => {
    // `detail: error.message` shipped Supabase/Postgres wording to any caller.
    // The consumer branches on ok/error codes only, so the message buys nothing
    // and can carry table names, hosts or SQL fragments.
    expect(src).not.toMatch(/detail:\s*error\.message/);
    expect(src).not.toMatch(/error\.message/);
  });

  it("still filters to published explicitly, so RLS is the second gate, not the only one", () => {
    expect(src).toContain('.eq("status", "published")');
  });
});
