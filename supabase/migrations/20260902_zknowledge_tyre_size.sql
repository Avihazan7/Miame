-- 20260902_zknowledge_tyre_size.sql
-- MiaMe · Brain RAG · the corpus can answer "what size are the tyres".
--
-- WHY — MEASURED ON THE LIVE CORPUS, 2026-09-02:
--     rows naming the tyres at all ............. 1  (spec-brakes, in passing)
--     rows stating the tyre SIZE ............... 0
--
--   `spec-brakes` says "מערכת מתלים מלאה קדמית ואחורית" and stops. A buyer asking
--   the assistant for the tyre size — the single most practical question after the
--   warranty, because it is what they will type into a parts search in two years —
--   gets a sentence about suspension.
--
-- PROVENANCE, AND WHY IT IS NOT THE PHOTOGRAPH
--   The figure is legible on the sidewall in the wheel close-up the site now shows
--   (components/Lifestyle.tsx, added 2026-09-02). It is published because the OWNER
--   CONFIRMED IT on 2026-09-02, not because a photograph showed it. Reading a spec
--   off pixels is inference, and this repo keeps specs quoted: the same discipline
--   that has `handNumber` cited rather than deduced applies to a number a buyer will
--   use to order a replacement.
--
-- THE FORM MATTERS FOR RETRIEVAL. Israeli buyers type the size several ways, and the
--   corpus is searched by embedding plus a Hebrew keyword top-up, so the row carries
--   the shape they type: the ISO-ish sidewall form (14.5X4.8-7), the ד"א-separated
--   form, the word צמיג in singular and plural, and the rim diameter alone ("7 אינץ׳")
--   — which is what someone comparing models actually asks for.
--
-- REPLAY ORDER
--   "zknowledge" sorts after every "knowledge_*" file of the same date, so a fresh
--   database ends where production does.
--
-- ROLLBACK: 20260902_zknowledge_tyre_size.rollback.sql — deletes the row it inserts
--   and restores spec-brakes to its exact prior body, md5-checked against the LIVE
--   row before this was applied: 3faca336212c9f74d861967fc3ad5ab0.
--   ⚠ The first draft of this header carried an INVENTED hash. It was replaced with
--   the measured one before anything was applied — the same mistake phase 18 records,
--   and the reason its note exists.

do $tyre$
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[tyre-size] public.knowledge absent - skipped.';
    return;
  end if;

  insert into public.knowledge (id, source, category, body, embedding, updated_at)
  values (
    'spec-tyres',
    'MiaMe/Specs',
    'specs',
    $b$מידת הצמיגים של מיה פור: 14.5X4.8-7 (14.5 על 4.8, חישוק 7 אינץ׳). צמיגי שטח רחבים על חישוקי סגסוגת, בכל ארבעת הגלגלים. הצמיג הרחב הוא מה שנותן אחיזה בחול, בחצץ ובשביל, בלי לוותר על נוחות בכביש.$b$,
    null,
    now()
  )
  on conflict (id) do update
    set body = excluded.body, source = excluded.source, category = excluded.category,
        embedding = null, updated_at = now();

  -- spec-brakes named the suspension and stopped. It now points at the size too, so a
  -- question that lands on the brakes row is not a dead end.
  update public.knowledge
     set body = $b$בלמים: דיסק הידראולי כפול 140 מ"מ; מערכת מתלים מלאה קדמית ואחורית, פלטפורמה מוגנת פטנט. צמיגי שטח במידה 14.5X4.8-7 על חישוקי סגסוגת.$b$,
         embedding = null, updated_at = now()
   where id = 'spec-brakes';

  -- POSTCONDITIONS — absolute, so a partial apply cannot report success.
  if (select count(*) from public.knowledge where body like '%14.5X4.8-7%') <> 2 then
    raise exception '[tyre-size] postcondition failed: expected 2 rows naming the size, found %',
      (select count(*) from public.knowledge where body like '%14.5X4.8-7%');
  end if;
  if (select count(*) from public.knowledge where id = 'spec-tyres') <> 1 then
    raise exception '[tyre-size] postcondition failed: spec-tyres missing.';
  end if;

  raise notice '[tyre-size] spec-tyres written; spec-brakes now names the size.';
end
$tyre$;
