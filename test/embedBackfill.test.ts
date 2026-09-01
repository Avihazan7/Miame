// test/embedBackfill.test.ts — the embedding backfill must be right on the FIRST run.
//
// The backfill spends provider credit and writes with the service role, and the
// corpus it fills is what the assistant answers from. Every case below is a way it
// could have finished LOOKING successful while being wrong, which is the only kind
// of failure that survives a one-off run nobody repeats.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

// brain/config freezes these into module constants at import time, so they are set
// before the dynamic imports below rather than inside a beforeEach.
process.env.VOYAGE_API_KEY = "test-voyage-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

const { POST } = await import("../app/api/embed/route");
const { embedDocuments, embedQuery } = await import("../brain/embeddings");

const TOKEN = "test-embed-admin-token";
const req = () =>
  new Request("https://www.miame.co.il/api/embed", {
    method: "POST",
    headers: { "x-admin-token": TOKEN }
  });

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** A fetch double that records every call, so what was NOT sent is assertable too. */
function wire(opts: {
  pending: Array<{ id: string; body: string }>;
  vectors: number[][];
  patchStatus?: (id: string) => number;
}) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const mock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.includes("/v1/embeddings")) {
      return json({ data: opts.vectors.map((embedding, index) => ({ embedding, index })) });
    }
    if (url.includes("/rest/v1/knowledge?select=")) return json(opts.pending);
    if (url.includes("/rest/v1/knowledge?id=eq.")) {
      const id = decodeURIComponent(url.split("id=eq.")[1]);
      const status = opts.patchStatus ? opts.patchStatus(id) : 204;
      return new Response(null, { status });
    }
    throw new Error(`unexpected fetch: ${url}`);
  });
  vi.stubGlobal("fetch", mock);
  return calls;
}

const vec = (n: number, fill = 0.01) => Array(n).fill(fill);

describe("the backfill refuses to write a vector of the wrong width", () => {
  beforeEach(() => {
    process.env.EMBED_ADMIN_TOKEN = TOKEN;
  });
  afterEach(() => {
    delete process.env.EMBED_ADMIN_TOKEN;
    vi.unstubAllGlobals();
  });

  it("502s before the first PATCH when the provider returns a different dimension", async () => {
    // knowledge.embedding is vector(1024). A model that ignores `output_dimension`
    // returns its own native width; the count check inside embedDocuments passes,
    // every vector is well-formed, and only the database would object — once per
    // row, as an opaque PATCH failure, after the credit is already spent. The width
    // is a property of the RESPONSE, so it is checked once, before anything writes.
    const calls = wire({
      pending: [
        { id: "a", body: "aleph" },
        { id: "b", body: "bet" }
      ],
      vectors: [vec(512), vec(512)]
    });
    const res = await POST(req());
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain("1024");
    expect(body.error).toContain("Nothing was written.");
    expect(calls.filter((c) => c.init?.method === "PATCH")).toHaveLength(0);
  });

  it("writes every row when the width is right", async () => {
    const calls = wire({
      pending: [
        { id: "a", body: "aleph" },
        { id: "b", body: "bet" }
      ],
      vectors: [vec(1024), vec(1024)]
    });
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, embedded: 2, total: 2, failed: [] });
    expect(calls.filter((c) => c.init?.method === "PATCH")).toHaveLength(2);
  });
});

describe("a partial run is reported, not hidden", () => {
  beforeEach(() => {
    process.env.EMBED_ADMIN_TOKEN = TOKEN;
  });
  afterEach(() => {
    delete process.env.EMBED_ADMIN_TOKEN;
    vi.unstubAllGlobals();
  });

  it("names the row AND the HTTP status of every write that failed", async () => {
    // "b failed" is not actionable; "b (HTTP 401)" is — it says the service key is
    // wrong, not that the row is. The operator gets one informed re-run instead of
    // three guesses.
    wire({
      pending: [
        { id: "a", body: "aleph" },
        { id: "b", body: "bet" }
      ],
      vectors: [vec(1024), vec(1024)],
      patchStatus: (id) => (id === "b" ? 401 : 204)
    });
    const res = await POST(req());
    const body = await res.json();
    expect(body).toMatchObject({ ok: false, embedded: 1, total: 2 });
    expect(body.failed).toEqual(["b (HTTP 401)"]);
  });

  it("the driver does not swallow a partial run as a total failure", () => {
    // The route sets ok = (failed.length === 0), so ONE failed row makes the whole
    // answer falsy. knowledge-embed.mjs used to exit on `!post.json.ok` alone, which
    // printed "backfill failed (200): unknown", hid the rows that DID land, and made
    // its own resumability advice unreachable code. A source assertion rather than a
    // behavioural one because the driver is a top-level script that calls
    // process.exit; it still fails the day the carve-out is deleted.
    const src = readFileSync("scripts/knowledge-embed.mjs", "utf8");
    expect(src).not.toMatch(/if\s*\(post\.status\s*!==\s*200\s*\|\|\s*!post\.json\.ok\)/);
    expect(src).toContain("const partial =");
  });
});

describe("the work list is read with the key that writes it", () => {
  beforeEach(() => {
    process.env.EMBED_ADMIN_TOKEN = TOKEN;
  });
  afterEach(() => {
    delete process.env.EMBED_ADMIN_TOKEN;
    vi.unstubAllGlobals();
  });

  it("selects the pending rows with the service role, not with anon", async () => {
    // Reading with anon while writing with the service role lets RLS decide what
    // "pending" means. A narrowed anon SELECT policy would hide rows that then are
    // never embedded AND never counted — the corpus stays NULL while the driver
    // reports it finished.
    const calls = wire({ pending: [{ id: "a", body: "aleph" }], vectors: [vec(1024)] });
    await POST(req());
    const select = calls.find((c) => c.url.includes("/rest/v1/knowledge?select="));
    expect(select).toBeTruthy();
    expect((select!.init!.headers as Record<string, string>).apikey).toBe("test-service-key");
  });
});

describe("retrieval and the backfill embed asymmetrically", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const bodyOf = (init?: RequestInit) => JSON.parse(String(init?.body ?? "{}"));

  it("stores documents as documents and embeds a question as a query", async () => {
    // Voyage places a query and the document that answers it in one space but with
    // different priors. Embedding the corpus as queries would not fail, it would
    // just retrieve worse — forever, and invisibly, because the vectors look fine.
    const seen: unknown[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_i: RequestInfo | URL, init?: RequestInit) => {
        seen.push(bodyOf(init).input_type);
        return json({ data: [{ embedding: vec(1024), index: 0 }] });
      })
    );
    await embedDocuments(["a stored passage"]);
    await embedQuery("a buyer's question");
    expect(seen).toEqual(["document", "query"]);
  });

  it("addresses a batch by index rather than by arrival order", async () => {
    // Nothing promises the batch comes back in request order, and a reordered batch
    // is invisible: every row gets a valid 1024-d vector belonging to someone else's
    // document, so the count check passes and retrieval quietly answers the wrong
    // questions.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        json({
          data: [
            { embedding: vec(1024, 0.3), index: 2 },
            { embedding: vec(1024, 0.1), index: 0 },
            { embedding: vec(1024, 0.2), index: 1 }
          ]
        })
      )
    );
    const out = await embedDocuments(["first", "second", "third"]);
    expect(out.map((v) => v[0])).toEqual([0.1, 0.2, 0.3]);
  });

  it("leaves the order alone when the provider sends no index", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        json({ data: [{ embedding: vec(1024, 0.1) }, { embedding: vec(1024, 0.2) }] })
      )
    );
    const out = await embedDocuments(["first", "second"]);
    expect(out.map((v) => v[0])).toEqual([0.1, 0.2]);
  });
});
