-- 20260901_knowledge_exact_vector_search.sql
-- MiaMe · Brain RAG · remove the ivfflat index that would have silently capped
--                     retrieval at ONE document.
--
-- WHY — MEASURED, NOT REASONED
--   `knowledge_embedding_idx` is `ivfflat (embedding vector_cosine_ops) WITH
--   (lists = 100)`. It was created by the schema, on an EMPTY table, and the live
--   corpus is 36 rows.
--
--   ivfflat is an APPROXIMATE index. It partitions vectors into `lists` clusters
--   with k-means over the rows present AT BUILD TIME, and a query probes
--   `ivfflat.probes` of them (default: 1). Built on an empty table there are no
--   meaningful centroids, and 100 lists over 36 rows leaves almost every list
--   empty regardless.
--
--   Reproduced on this database, 2026-08-31, in a rolled-back transaction: a temp
--   table indexed while empty, then filled with 36 rows, with enable_seqscan off.
--
--       rows in table ........ 36
--       LIMIT 10  returned .... 1
--       LIMIT 36  returned .... 1
--
--   One row. Not an error, not zero — ONE.
--
-- WHY THAT IS WORSE THAN A BROKEN INDEX
--   brain/knowledge.ts:
--
--       const hits = await vectorRetrieve(query, k);
--       if (hits.length) return hits;   // empty ⇒ fall through to keyword
--
--   The fallback triggers on ZERO. One hit is truthy, so the moment the embedding
--   backfill runs, the brain would stop falling back and start answering from a
--   SINGLE retrieved document instead of four — with no error, no log line and no
--   failing check. The long-awaited backfill would have made retrieval WORSE than
--   the keyword path it replaced, and the regression would have been invisible.
--   That is the exact shape of failure this repo has paid for before: the work
--   that fails silently is the work nobody is watching.
--
-- WHY THE FIX IS "NO INDEX" AND NOT "BETTER PARAMETERS"
--   Dropping the index makes pgvector do an EXACT cosine scan — the correct answer
--   every time, no recall parameter to get wrong, nothing to rebuild after a write.
--   An ANN index trades accuracy for speed, and at this size there is no speed to
--   buy. Measured on this database, same session, exact scan over 5,000 rows of
--   real 1024-d vectors — 139x the live corpus:
--
--       EXPLAIN ANALYZE ... ORDER BY v <=> $1 LIMIT 8
--       Seq Scan + top-N heapsort · Actual Rows 8 · Execution Time 53.7 ms
--
--   8 of 8, at 139x the data. At 36 rows it is sub-millisecond.
--
-- WHEN TO BRING AN INDEX BACK
--   Not before the corpus is in the tens of thousands of rows, and then only:
--     · built AFTER the rows exist, never on an empty table; and
--     · ivfflat with lists ≈ rows/1000 and ivfflat.probes tuned to match, or
--     · HNSW, which builds incrementally and has no empty-build failure mode.
--   Whichever is chosen, the acceptance test is the one above: ask for k and
--   count what comes back. A vector index that returns fewer rows than requested
--   is not a fast index, it is a wrong one.
--
-- SAFETY
--   · Guarded: no-op where public.knowledge is absent.
--   · DROP INDEX IF EXISTS — idempotent, and it removes an index that has never
--     served a single query (every embedding is NULL).
--   · No data is touched. No column, policy or function changes.
--   · Reversible in full: the rollback recreates the index byte-for-byte.
--
-- ROLLBACK: 20260901_knowledge_exact_vector_search.rollback.sql

do $exact$
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[knowledge-exact] public.knowledge absent - skipped.';
    return;
  end if;

  drop index if exists public.knowledge_embedding_idx;

  -- Leave the reason where the next person will find it: on the column itself.
  comment on column public.knowledge.embedding is
    'voyage-3.x, 1024-d, cosine. DELIBERATELY UNINDEXED: exact scan is correct and '
    'sub-millisecond at this corpus size. An ivfflat index built on the empty table '
    'returned 1 row for any k (measured 2026-08-31). Re-index only above tens of '
    'thousands of rows, built AFTER the data exists, and verify that a k-row request '
    'returns k rows.';

  raise notice '[knowledge-exact] ivfflat dropped; retrieval is now exact.';
end
$exact$;
