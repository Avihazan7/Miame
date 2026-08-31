// test/retrievalDepth.test.ts — the retrieval-depth contract for brain/knowledge.ts.
//
// THE INCIDENT THIS ENCODES (measured 2026-08-31, not hypothetical).
//   public.knowledge shipped with `knowledge_embedding_idx`: an ivfflat index,
//   lists=100, created on an EMPTY table. Reproduced on the live database in a
//   rolled-back transaction — indexed while empty, then filled with 36 rows — it
//   returned ONE row for LIMIT 10 and ONE row for LIMIT 36.
//
//   On its own that is a bad index. What made it dangerous was the caller:
//
//       if (hits.length) return hits;   // ← one hit counted as success
//
//   The keyword fallback triggers on ZERO. One is truthy. So the moment the
//   long-awaited embedding backfill landed, the brain would have stopped falling
//   back and started answering every question from a SINGLE document instead of
//   four — no error, no log line, no failing check. The backfill would have made
//   retrieval worse than the keyword path it replaced, invisibly.
//
//   The index is gone (20260901_knowledge_exact_vector_search). These tests guard
//   the CLASS rather than that one instance: a vector path that returns fewer
//   documents than asked for must never be accepted as a complete answer.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

process.env.VOYAGE_API_KEY = "test-voyage-key";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

const { retrieve } = await import("../brain/knowledge");

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });

/** One embedding call, then per-endpoint replies. */
function wire(opts: { vector: unknown[]; corpus: unknown[] }) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/embeddings")) return json({ data: [{ embedding: Array(1024).fill(0.01) }] });
    if (url.includes("/rpc/match_knowledge")) return json(opts.vector);
    if (url.includes("/knowledge?select=")) return json(opts.corpus);
    throw new Error(`unexpected fetch: ${url}`);
  });
}

const vrow = (id: string) => ({ id, source: "V", body: `וקטור ${id} מיה פור`, similarity: 0.9 });
const crow = (id: string) => ({ id, source: "K", body: `מילות מפתח ${id} מיה פור` });

describe("a short vector answer is never accepted as a complete one", () => {
  let fetchMock: ReturnType<typeof wire>;
  const use = (o: { vector: unknown[]; corpus: unknown[] }) => {
    fetchMock = wire(o);
    vi.stubGlobal("fetch", fetchMock);
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("tops a one-row vector answer up to k — the exact ivfflat failure", () => {
    // What the degenerate index actually did: one row, for any k.
    use({ vector: [vrow("v1")], corpus: ["c1", "c2", "c3", "c4", "c5"].map(crow) });
    return retrieve("מיה פור", 4).then((docs) => {
      expect(docs, "one document is not an answer to a request for four").toHaveLength(4);
      expect(docs[0].id, "the vector hit must stay first — it is the better match").toBe("v1");
    });
  });

  it("never returns the same document twice while topping up", async () => {
    // The keyword path reads the same corpus, so overlap is the normal case.
    use({ vector: [vrow("a")], corpus: [crow("a"), crow("b"), crow("c"), crow("d")] });
    const docs = await retrieve("מיה פור", 4);
    expect(new Set(docs.map((d) => d.id)).size).toBe(docs.length);
  });

  it("leaves a full vector answer alone", async () => {
    // No top-up when the vector path did its job: this must not become a tax on
    // the healthy path.
    use({ vector: ["v1", "v2", "v3", "v4"].map(vrow), corpus: [crow("c1")] });
    const docs = await retrieve("מיה פור", 4);
    expect(docs.map((d) => d.id)).toEqual(["v1", "v2", "v3", "v4"]);
    expect(fetchMock.mock.calls.some((c) => String(c[0]).includes("knowledge?select=")))
      .toBe(false);
  });

  it("still falls back completely when the vector path returns nothing", async () => {
    use({ vector: [], corpus: [crow("c1"), crow("c2")] });
    const docs = await retrieve("מיה פור", 4);
    expect(docs.map((d) => d.id)).toEqual(["c1", "c2"]);
  });

  it("does not invent documents when the corpus is genuinely smaller than k", async () => {
    // Short because there is nothing more to give is CORRECT. The contract is
    // "never silently thin", not "always exactly k".
    use({ vector: [vrow("v1")], corpus: [crow("v1")] });
    const docs = await retrieve("מיה פור", 4);
    expect(docs).toHaveLength(1);
    expect(docs[0].id).toBe("v1");
  });
});
