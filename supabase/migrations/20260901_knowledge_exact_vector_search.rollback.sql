-- Rollback for 20260901_knowledge_exact_vector_search.sql
--
-- Recreates knowledge_embedding_idx exactly as it was, and restores the column to
-- having no comment.
--
-- ⚠ READ THIS BEFORE RUNNING IT. This rollback reinstates a MEASURED DEFECT: with
--   the corpus at its current size the index returns ONE row for any k, and
--   brain/knowledge.ts treats one row as success and stops falling back. Running
--   this is correct only to restore a prior state exactly (a bisect, a schema
--   comparison) — never as a fix.
--
--   If the goal is a working vector index rather than the old one, do not run this:
--   build it after the rows exist, size `lists` to the row count (or use HNSW), and
--   assert that a k-row request returns k rows.

do $rb$
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[knowledge-exact/rollback] public.knowledge absent - skipped.';
    return;
  end if;

  create index if not exists knowledge_embedding_idx
    on public.knowledge using ivfflat (embedding extensions.vector_cosine_ops)
    with (lists = 100);

  comment on column public.knowledge.embedding is null;

  raise notice '[knowledge-exact/rollback] ivfflat recreated (see the warning above).';
end
$rb$;
