-- Rollback for 20260901_knowledge_zzz_catalog_alignment.sql
--
-- Restores the three model rows byte-for-byte as captured from the live database on
-- 2026-09-01, and removes the SPYQE pricing row this migration created.
--
-- ⚠ RUNNING THIS REINSTATES A MEASURED DEFECT: the catalogue goes back to naming the
--   models "4x2" / "2x4" / "4x4" — designations that appear on no rendered surface —
--   so a buyer searching by the names the storefront shows them matches nothing, and
--   "2x4" resolves to the Long Range rather than the entry model. Run it only to
--   restore a prior state exactly, never as a fix.

do $rb$
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[catalog-align/rollback] public.knowledge absent - skipped.';
    return;
  end if;

  update public.knowledge
     set body = $b$מיה פור 4x2 (העירוני החכם) — מחיר MiaMe החל מ-19,900 ש"ח.$b$,
         embedding = null, updated_at = now()
   where id = 'price-4x2';

  update public.knowledge
     set body = $b$מיה פור 2x4 Long Range (טווח מורחב 35Ah) — מחיר MiaMe החל מ-21,900 ש"ח.$b$,
         embedding = null, updated_at = now()
   where id = 'price-2x4lr';

  update public.knowledge
     set body = $b$מיה פור 4x4 (4 מנועים, הנעה כפולה לשטח) — מחיר MiaMe החל מ-27,900 ש"ח.$b$,
         embedding = null, updated_at = now()
   where id = 'price-4x4';

  delete from public.knowledge where id = 'price-spyqe';

  raise notice '[catalog-align/rollback] pre-alignment catalogue restored.';
end
$rb$;
