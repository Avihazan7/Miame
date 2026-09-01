-- 20260901_knowledge_zzzzz_model_names_everywhere.rollback.sql
--
-- ⚠️ THIS REINSTATES A MEASURED DEFECT. Running it puts the internal ids back where
--    the product names belong: `model-choose` — the row that answers "איך לבחור דגם",
--    the comparison question a buyer asks before choosing — goes back to naming all
--    three models by designations that appear on no surface and in no source, one of
--    them ("4×2") with the digits reversed relative to the real name. `spec-weight`
--    goes back to "(דגם 4x2)".
--
--    Run it only to undo the migration, never to "restore" anything.
--
-- The two bodies below were md5-checked against the LIVE rows before the forward
-- migration was applied and matched byte-for-byte:
--     model-choose  4c78bd6a1068121984c960080779c6ee
--     spec-weight   83279c0b1a890bccc72db0a646951ade
-- so this undo is verified rather than asserted.

do $names_rb$
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[model-names/rollback] public.knowledge absent - skipped.';
    return;
  end if;

  update public.knowledge
     set body = $b$איך לבחור דגם: 4×2 לעיר וזריזות · 2×4 Long Range לטווח מורחב (35Ah) · 4×4 לארבעה מנועים והנעה כפולה בשטח.$b$,
         embedding = null, updated_at = now()
   where id = 'model-choose';

  update public.knowledge
     set body = $b$משקל הכלי 42 ק"ג (דגם 4x2); עומס מרבי עד 136 ק"ג.$b$,
         embedding = null, updated_at = now()
   where id = 'spec-weight';

  -- The embedding is cleared on the way BACK too, for the same reason it is cleared
  -- on the way forward: a vector computed from the corrected text must not survive
  -- a reversion to the old text.

  raise notice '[model-names/rollback] internal ids reinstated - a measured defect is live again.';
end
$names_rb$;
