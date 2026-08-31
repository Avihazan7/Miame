-- MiaMe.co.il · Migration: pin search_path on public.match_knowledge.
--
-- Security hardening for the RAG retrieval function used by the demand brain
-- (brain/knowledge.ts → rpc/match_knowledge). Supabase advisor lint 0011
-- (function_search_path_mutable) flags functions without a fixed search_path:
-- a mutable path lets an object created earlier on the path shadow the intended
-- one. The function is SECURITY INVOKER and references only public objects
-- (the `knowledge` table + pgvector operators), so pinning the path is fully
-- behaviour-preserving — identical rows, identical order.
--
-- Applied out-of-band to production during the end-to-end audit; this file makes
-- the change tracked and reproducible (no drift between repo and prod).
-- Idempotent: ALTER ... SET is safe to run more than once.

-- ⚠ SUPERSEDED by 20260723115312_vector_extension_isolation.sql, which moved the
--    pgvector type into the `extensions` schema and recreated this function against
--    it. A bare `vector` no longer resolves unless the applying session happens to
--    carry `extensions` on its search_path, so the unguarded ALTER below used to
--    abort a re-apply against production with "function does not exist".
--
--    It is now guarded on the exact signature it targets: on a fresh replay it runs
--    (the extension is still in `public` at this point in the order) and on today's
--    production it is a clean no-op, leaving the pin that 20260723115312 installed.
do $pin$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    join pg_type t on t.oid = p.proargtypes[0]
    join pg_namespace tn on tn.oid = t.typnamespace
    where n.nspname = 'public'
      and p.proname = 'match_knowledge'
      and t.typname = 'vector'
      and tn.nspname = 'public'
  ) then
    execute 'alter function public.match_knowledge(public.vector, integer) set search_path = public, pg_temp';
  else
    raise notice '[match_knowledge-pin] public.vector signature absent — superseded by 20260723115312, skipped.';
  end if;
end
$pin$;
