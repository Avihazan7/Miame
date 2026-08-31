-- 20260723115312_vector_extension_isolation.sql
-- MiaMe.co.il · RECOVERED FROM PRODUCTION — this DDL existed only in the live
-- database and could not be reproduced from git.
--
-- PROVENANCE
--   Live ledger row supabase_migrations.schema_migrations
--   version 20260723115312, name "miame_vector_extension_isolation_20260723".
--   Verbatim text preserved (byte-identical, md5 7382b4f1bdc889f422dddf08f2e646b1,
--   577 bytes) at docs/evidence/out-of-band-2026-07-23/.
--
-- WHAT IT DOES
--   Moves the pgvector extension out of `public` into `extensions` (Supabase's
--   advisor flags extensions installed in public), and recreates
--   public.match_knowledge against the relocated type. The function keeps
--   SECURITY INVOKER and gains a pinned search_path.
--
-- ⚠ THIS SUPERSEDES 20260704_harden_match_knowledge_search_path.sql, which
--   targets `public.match_knowledge(vector, integer)` — a signature that no
--   longer resolves once the type lives in `extensions`, unless the applying
--   session happens to carry `extensions` on its search_path. That file is now
--   a guarded no-op; see its header.
--
-- IDEMPOTENT: the ALTER EXTENSION is guarded (it errors when the extension is
-- already in the target schema), and CREATE OR REPLACE FUNCTION converges.
-- Verified against live production 2026-08-31: extension `vector` is in schema
-- `extensions` (v0.8.0) and match_knowledge carries proconfig
-- {search_path=pg_catalog}, prosecdef=false.
--
-- ROLLBACK: 20260723115312_vector_extension_isolation.rollback.sql

do $iso$
begin
  if exists (
    select 1 from pg_extension e
      join pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'vector' and n.nspname <> 'extensions'
  ) then
    execute 'alter extension vector set schema extensions';
  end if;
end
$iso$;

create or replace function public.match_knowledge(
  query_embedding extensions.vector,
  match_count integer default 4
)
returns table(id text, source text, body text, similarity double precision)
language sql
stable
set search_path = pg_catalog
as $function$
  select k.id, k.source, k.body,
         1 - (k.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.knowledge k
  where k.embedding is not null
  order by k.embedding operator(extensions.<=>) query_embedding
  limit match_count;
$function$;
