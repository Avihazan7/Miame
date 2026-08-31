-- Rollback for 20260629_knowledge_zz_reconcile_columns.sql
--
-- ⚠ DROPPING `category` DESTROYS DATA: 20260714_knowledge_full_seed_from_crimson_lever.sql
--    seeds a value into it for all 30 rows. Only run this to unwind a bad apply on a
--    database you are willing to re-seed. `updated_at` is derived and safe to drop.

do $rb$
begin
  if to_regclass('public.knowledge') is null then return; end if;
  alter table public.knowledge drop column if exists updated_at;
  -- category intentionally NOT dropped by default — uncomment only with intent:
  -- alter table public.knowledge drop column if exists category;
end
$rb$;

-- The policy convergence is deliberately NOT rolled back. Undoing it would
-- recreate a PUBLIC-wide read grant and an auth.role() predicate that Supabase
-- documents as deprecated — reinstating a weaker, older contract is a regression,
-- not an undo. `anon read knowledge` is what production has always run.
