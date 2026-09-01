-- Rollback for 20260901_knowledge_zzzz_vocabulary_gaps.sql
--
-- Restores the `finance` and `lead` bodies byte-for-byte as captured from the live
-- database on 2026-09-01, before the rewrite.
--
-- ⚠ RUNNING THIS REINSTATES TWO MEASURED DEFECTS. "מימון" goes back to appearing in
--   exactly ONE row of the corpus — the disabled-veterans subsidy — so a buyer asking
--   about payment terms is answered from a Ministry of Defence entitlement, with no
--   second document in context. And no row says how to order a MIA FOUR, so the
--   ordering question falls to SPYQE's pre-order sign-up or to the row about paint.
--   Run it to restore a prior state exactly, never as a fix.

do $rb$
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[vocab-gaps/rollback] public.knowledge absent - skipped.';
    return;
  end if;

  update public.knowledge
     set body = $b$מסלולי תשלום ב-0% ריבית בכפוף לאישור עסקה; עד 18 תשלומים ללא ריבית והצמדה. הסימולטור באתר בונה הצעה תוך דקה.$b$,
         embedding = null, updated_at = now()
   where id = 'finance';

  update public.knowledge
     set body = $b$פנייה ועסקה דרך WhatsApp: הסימולטור שולח הצעה מלאה - דגם, מקדמה, מספר תשלומים ותשלום חודשי - ישירות לוואטסאפ.$b$,
         embedding = null, updated_at = now()
   where id = 'lead';

  raise notice '[vocab-gaps/rollback] pre-rewrite finance and lead restored.';
end
$rb$;
