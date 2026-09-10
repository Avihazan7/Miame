// Route-handler tests: the App Router handlers are plain (Request) => Response
// functions, so they run under vitest without a dev server. No ANTHROPIC/VOYAGE
// key is set here, so no paid call can ever fire — the guards reject first.
import { afterEach, describe, expect, it } from "vitest";
import { POST as leadPost } from "@/app/api/lead/route";
import { POST as brainPost } from "@/app/api/brain/route";
import { GET as embedGet, POST as embedPost } from "@/app/api/embed/route";
import { POST as dealPost } from "@/app/api/deal/route";
import { POST as mediaEventsPost } from "@/app/api/vehicle-media-events/route";

const post = (url: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

// Distinct IPs per test keep the shared in-memory buckets from cross-talking.
//
// This used to send `x-real-ip`, and on 2026-09-10 that stopped separating anything:
// clientIp now reads ONLY the platform header, because the fallback chain let any
// caller pick the rate limiter's bucket key (lib/apiGuard.ts). The suite still passed
// — every test here stays under its ceiling even sharing one bucket — so the helper
// went on claiming an isolation it no longer provided, which is the kind of quiet lie
// that costs an afternoon the first time a test is added above the limit.
let ipCounter = 0;
const ip = () => ({ "x-vercel-forwarded-for": `10.9.${++ipCounter}.1` });

describe("POST /api/lead (M1 guards)", () => {
  it("403s a foreign browser origin", async () => {
    const res = await leadPost(
      post("https://www.miame.co.il/api/lead", { name: "a" }, { origin: "https://evil.example", host: "www.miame.co.il", ...ip() })
    );
    expect(res.status).toBe(403);
  });

  it("400s an out-of-bounds payload (name too long)", async () => {
    const res = await leadPost(post("https://www.miame.co.il/api/lead", { name: "x".repeat(81) }, ip()));
    expect(res.status).toBe(400);
  });

  it("honeypot: acknowledges and does NOT reach the pipeline", async () => {
    const res = await leadPost(
      post("https://www.miame.co.il/api/lead", { name: "bot", website: "http://spam" }, ip())
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("503s (brain unconfigured) only AFTER validation passes — no key in test env", async () => {
    const res = await leadPost(post("https://www.miame.co.il/api/lead", { name: "דנה", phone: "0500000000" }, ip()));
    expect(res.status).toBe(503);
  });

  it("429s past the per-IP budget", async () => {
    const fixed = { "x-real-ip": "10.8.0.1" };
    for (let i = 0; i < 5; i++) {
      await leadPost(post("https://www.miame.co.il/api/lead", { name: "a" }, fixed));
    }
    const res = await leadPost(post("https://www.miame.co.il/api/lead", { name: "a" }, fixed));
    expect(res.status).toBe(429);
  });
});

describe("POST /api/brain (M1 guards)", () => {
  it("413s an oversized event body", async () => {
    const res = await brainPost(
      post("https://www.miame.co.il/api/brain", { type: "faq", pad: "x".repeat(20_000) }, ip())
    );
    expect(res.status).toBe(413);
  });

  it("400s a missing event.type", async () => {
    const res = await brainPost(post("https://www.miame.co.il/api/brain", { not: "an event" }, ip()));
    expect(res.status).toBe(400);
  });

  it("503s (brain unconfigured) after guards pass — never a raw upstream error", async () => {
    const res = await brainPost(post("https://www.miame.co.il/api/brain", { type: "faq" }, ip()));
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBeTruthy();
    // no secret material / provider account detail (the env-var NAME is fine)
    expect(body.error).not.toMatch(/sk-|billing|request.id/i);
  });
});

describe("/api/embed (M1 admin gate — fails closed)", () => {
  afterEach(() => {
    delete process.env.EMBED_ADMIN_TOKEN;
  });

  it("503s when EMBED_ADMIN_TOKEN is not configured (GET + POST)", async () => {
    const g = await embedGet(new Request("https://www.miame.co.il/api/embed"));
    expect(g.status).toBe(503);
    const p = await embedPost(new Request("https://www.miame.co.il/api/embed", { method: "POST" }));
    expect(p.status).toBe(503);
  });

  it("401s a wrong/missing token when configured", async () => {
    process.env.EMBED_ADMIN_TOKEN = "test-fixture-token";
    const missing = await embedGet(new Request("https://www.miame.co.il/api/embed"));
    expect(missing.status).toBe(401);
    const wrong = await embedPost(
      new Request("https://www.miame.co.il/api/embed", { method: "POST", headers: { "x-admin-token": "nope" } })
    );
    expect(wrong.status).toBe(401);
  });
});

describe("POST /api/deal (M1 guards)", () => {
  it("honeypot: returns the soft-degrade shape without relaying", async () => {
    const res = await dealPost(
      post("https://www.miame.co.il/api/deal", { ref: "r", model: "m", customerType: "private", quote: {}, website: "spam" }, ip())
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, captured: false });
  });

  it("400s when required fields are missing", async () => {
    const res = await dealPost(post("https://www.miame.co.il/api/deal", { ref: "r" }, ip()));
    expect(res.status).toBe(400);
  });

  it("soft-degrades (captured:false) when the central brain is unconfigured", async () => {
    const res = await dealPost(
      post(
        "https://www.miame.co.il/api/deal",
        { ref: "r1", model: "Comfort 4", customerType: "private", quote: { basePrice: 16900, effectivePrice: 16900, months: 18 } },
        ip()
      )
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: false, captured: false });
  });
});

describe("POST /api/vehicle-media-events (an unauthenticated service_role write)", () => {
  // This route inserts with SUPABASE_SERVICE_ROLE_KEY — the one principal in the
  // project that bypasses RLS — on behalf of an anonymous caller. `payload` was
  // `z.record(z.unknown())`: an object of any shape and any depth, bounded only by the
  // 8,000-byte body cap, going straight into a jsonb column.
  //
  // The whole application sends one payload: `{ frames: number }`
  // (components/Product360Stage.tsx:153). The permissive shape bought nothing.
  const ev = (payload?: unknown) =>
    post(
      "https://www.miame.co.il/api/vehicle-media-events",
      payload === undefined
        ? { vehicleId: "mia-four", type: "model3d_view" }
        : { vehicleId: "mia-four", type: "spin360_view", payload },
      ip(),
    );

  it("accepts what the application actually sends", async () => {
    // 400 would mean the bound broke the feature. Anything else means the payload
    // cleared validation — including the 500 this returns without a service key,
    // which is the DB step and therefore proof the schema let it through.
    expect((await mediaEventsPost(ev({ frames: 36 }))).status).not.toBe(400);
    expect((await mediaEventsPost(ev())).status).not.toBe(400);
  });

  for (const [label, payload] of [
    ["a nested object", { a: { b: { c: 1 } } }],
    ["an array value", { a: [1, 2, 3] }],
    ["more than eight keys", Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`k${i}`, 1]))],
    ["an over-long string value", { s: "A".repeat(300) }],
    ["an over-long key", { ["k".repeat(60)]: 1 }],
  ] as const) {
    it(`400s ${label}`, async () => {
      expect((await mediaEventsPost(ev(payload))).status).toBe(400);
    });
  }
});
