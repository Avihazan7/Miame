-- 20260902_zknowledge_tyre_size.rollback.sql
--
-- ⚠️ THIS REINSTATES A MEASURED GAP. Running it returns the corpus to a state where
--    NO row states the tyre size — so a buyer asking the assistant "what size are the
--    tyres", the question they will ask again in two years when they need a
--    replacement, is answered with a sentence about the suspension. The size is on
--    the page and legible in the wheel photograph either way; only the assistant
--    loses it. Run it only to undo the migration.
--
-- The spec-brakes body below was md5-checked against the LIVE row before the forward
-- migration was applied and matched byte-for-byte:
--     spec-brakes  3faca336212c9f74d861967fc3ad5ab0

do $tyre_rb$
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[tyre-size/rollback] public.knowledge absent - skipped.';
    return;
  end if;

  delete from public.knowledge where id = 'spec-tyres';

  update public.knowledge
     set body = $b$בלמים: דיסק הידראולי כפול 140 מ"מ; מערכת מתלים מלאה קדמית ואחורית, פלטפורמה מוגנת פטנט.$b$,
         embedding = null, updated_at = now()
   where id = 'spec-brakes';

  if (select count(*) from public.knowledge where body like '%14.5X4.8-7%') <> 0 then
    raise exception '[tyre-size/rollback] postcondition failed: a row still names the size.';
  end if;

  raise notice '[tyre-size/rollback] spec-tyres removed; spec-brakes restored.';
end
$tyre_rb$;
