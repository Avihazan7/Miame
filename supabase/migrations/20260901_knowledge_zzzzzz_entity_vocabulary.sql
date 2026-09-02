-- 20260901_knowledge_zzzzzz_entity_vocabulary.sql
-- MiaMe · Brain RAG · the corpus can name the entity a buyer is asking about.
--
-- WHY — MEASURED ON THE LIVE CORPUS, 2026-09-01 (37 rows):
--     rows containing "מיה דיינמיקס" ... 0     ← the manufacturer has no Hebrew name
--     rows containing "MIA FOUR"      ... 0     ← the product has no Latin name
--     rows containing "קלנועי*"       ... 3     ← what the thing legally IS
--     a row answering "what is MIA FOUR" ... NONE
--
--   The last line is the finding. SPYQE has `spyqe-what`, which states plainly what
--   it is. The MAIN product has no equivalent: 13 rows mention מיה פור while
--   discussing price, delivery or specs, and not one of them says what it is. An
--   answer engine asked "מה זה מיה פור" has nothing to resolve the entity against,
--   and a buyer asking the same gets a price quoted at them instead of an answer.
--
--   The vocabulary gaps are the same defect this repo already paid for twice: with
--   SPYQE (0 rows contained "ספייק" while 7 contained "SPYQE") and with the model
--   names ("4×2", a designation from no source). Retrieval here is keyword-first
--   over body text, so a term absent from every body is a query that matches
--   nothing at all — silently, with no error and no empty state.
--
-- WHAT — two rows, because two questions had no answer, not because two keywords
-- were missing. Each is SHORT on purpose: retrieval normalises by length, so
-- padding a row pushes it DOWN for the question it exists to answer. That was
-- measured in phase 15 and is not re-learned here.
--
--   mia-four-what  · what the product IS, under every name it answers to
--   manufacturer   · who makes it, in both scripts
--
-- WHAT IT DELIBERATELY DOES NOT DO
--   It does not sprinkle the terms through the other 37 rows. A row earns a word by
--   being about it; a corpus where every row names every term ranks worse, not
--   better, because IDF collapses and length normalisation punishes the padding.
--
-- REPLAY ORDER
--   "zzzzzz" sorts after "zzzzz" (model names), so a fresh database seeds, aligns,
--   corrects, then gains these two rows — the same end state as live.
--
-- ROLLBACK: 20260901_knowledge_zzzzzz_entity_vocabulary.rollback.sql

do $vocab$
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[entity-vocab] public.knowledge absent - skipped.';
    return;
  end if;

  insert into public.knowledge (id, source, category, body)
  values
    ('mia-four-what', 'MiaMe/Models', 'models',
     $b$מיה פור (MIA FOUR, ולפעמים פשוט "מיה") היא קלנועית חשמלית על פלטפורמת ארבעה גלגלים מוגנת פטנט, מתוצרת MIA Dynamics (מיה דיינמיקס). היא מסווגת כקלנועית ואינה רכב: אין לה לוחית רישוי ואין אגרות רישוי.$b$),
    ('manufacturer', 'MiaMe/Brand', 'models',
     $b$היצרן של מיה פור הוא MIA Dynamics (מיה דיינמיקס), שעל הפלטפורמה שלו בנויים גם מיה פור וגם SPYQE (ספייק). היבואן הרשמי בישראל הוא MEU · Mayer Electric Utilities.$b$)
  on conflict (id) do update
    set source = excluded.source, category = excluded.category,
        body = excluded.body, embedding = null, updated_at = now();

  -- Postconditions, absolute. A corpus that cannot be asked about the entity it
  -- describes is not a corpus — fail loudly rather than serve it.
  if not exists (select 1 from public.knowledge where body like '%מיה דיינמיקס%') then
    raise exception '[entity-vocab] no row names the manufacturer in Hebrew';
  end if;
  if not exists (select 1 from public.knowledge where body like '%MIA FOUR%') then
    raise exception '[entity-vocab] no row names the product in Latin';
  end if;
  if not exists (
    select 1 from public.knowledge where id = 'mia-four-what' and body like '%קלנועית%'
  ) then
    raise exception '[entity-vocab] the definition row does not say what the product is';
  end if;

  raise notice '[entity-vocab] the entity can be named in both scripts.';
end
$vocab$;
