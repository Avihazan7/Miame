-- 20260901_knowledge_zzzz_vocabulary_gaps.sql
-- MiaMe · Brain RAG · two words the corpus never said, and the answers that went wrong.
--
-- WHY — MEASURED ON THE LIVE CORPUS, 2026-09-01 (37 rows, every embedding NULL, so
-- retrieval is entirely the Hebrew keyword path and it matches on BODY TEXT):
--
--     rows containing "מימון" ................ 1   → subsidy-disabled, and only it
--     `finance` contains "מימון" ............. no
--     rows answering "how do I order" ........ 0 for MIA FOUR
--       (rows with "הזמנה"/"להזמין": 5 — delivery + four SPYQE rows)
--
--   1 · FINANCING. The `finance` row describes 18 interest-free instalments and the
--     simulator, and never once uses the word a Hebrew buyer actually types. "מימון"
--     appeared in EXACTLY ONE row of the whole corpus: `subsidy-disabled`, the IDF
--     rehabilitation-branch subsidy for disabled veterans. So "יש מימון" returned a
--     SINGLE document — that one — and a routine commercial question about payment
--     terms was answered out of a Ministry of Defence entitlement. That is the wrong
--     answer, and it is the wrong answer in a place where being wrong matters.
--
--   2 · ORDERING. No row said how to buy a MIA FOUR. `lead` described what the
--     simulator sends, without ever naming the act — no "הזמנה", no "רכישה", no
--     "מזמינים". So "איך אני מזמין" fell to whichever row happened to carry a lookalike
--     of the stripped stem, and the corpus answered that the vehicle comes in premium
--     black. With the ranker fixed it fell instead to SPYQE's PRE-ORDER sign-up: the
--     other product, and not a purchase at all.
--
-- WHAT — two body rewrites, minimal by construction. Both rows already described the
--   right thing; each was missing the word the buyer uses for it. `finance` gains
--   "מימון" in its opening phrase and nothing else. `lead` is re-headed "איך מזמינים
--   מיה פור" and names the act — הזמנה ורכישה — keeping the simulator sentence intact.
--   Both stay SHORT on purpose: retrieval normalises by length, so padding a row with
--   disclosure text pushes it DOWN for the very question it answers. Measured: an
--   earlier 290-character version of `finance` lost "כמה תשלומים אפשר" to another row.
--
-- MEASURED RESULT, on 25 buyer questions run against the live corpus before and after
--   (this migration together with the ranker fixes in brain/knowledge.ts, same commit):
--     4 rank-1 answers corrected · 0 regressions
--       "איך אני מזמין"    colors      → lead
--       "מה הסוללה"        price-4x2   → spec-battery
--       "כמה תשלומים אפשר" testride    → finance
--       "כמה עולה להשכיר"  price-4x2   → rental
--   AND "יש מימון" stops being a one-document answer: `finance` now ranks 2nd, so the
--   Master receives it. It is NOT first — `subsidy-disabled` is the shorter row and
--   both carry the term exactly once, so length decides. A single-content-word query
--   is settled by length in this ranker; that is a real limit and the embedding
--   backfill is what removes it. It is recorded here rather than papered over by
--   trimming a row to win a tiebreak.
--
-- WHAT IT DELIBERATELY DOES NOT DO
--   It does not add a disclosure paragraph to `finance`. The financing disclosure
--   already lives on the surfaces that quote a number (lib/finance.ts and the
--   simulator); repeating it inside a retrieval row buys nothing and costs the rank.
--
-- REPLAY ORDER
--   "zzzz" sorts after the "zzz" catalogue alignment, so on a fresh database the rows
--   are seeded, renamed, aligned, then reworded — same end state.
--
-- ROLLBACK: 20260901_knowledge_zzzz_vocabulary_gaps.rollback.sql

do $vocab$
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[vocab-gaps] public.knowledge absent - skipped.';
    return;
  end if;

  -- The row already meant this. It simply never said the word.
  update public.knowledge
     set body = $b$מימון ומסלולי תשלום ב-0% ריבית בכפוף לאישור עסקה; עד 18 תשלומים ללא ריבית והצמדה. הסימולטור באתר בונה הצעה תוך דקה.$b$,
         embedding = null, updated_at = now()
   where id = 'finance';

  -- Names the act, and says which product it is the act for: SPYQE's own path is a
  -- pre-order registration and is described by its own rows.
  update public.knowledge
     set body = $b$איך מזמינים מיה פור: הזמנה ורכישה דרך וואטסאפ. הסימולטור שולח הצעה מלאה - דגם, מקדמה, מספר תשלומים ותשלום חודשי - ישירות לוואטסאפ.$b$,
         embedding = null, updated_at = now()
   where id = 'lead';

  -- Postconditions, absolute. Each states the defect this migration exists to end, so
  -- a replay that cannot satisfy it has NOT produced the corpus this phase describes.
  if not exists (select 1 from public.knowledge where id = 'finance' and body like '%מימון%') then
    raise exception '[vocab-gaps] the finance row still does not contain the word מימון';
  end if;
  if (select count(*) from public.knowledge where body like '%מימון%') < 2 then
    raise exception '[vocab-gaps] מימון still resolves to a single row';
  end if;
  if not exists (
    select 1 from public.knowledge
     where id = 'lead' and body like '%מזמינים%' and body like '%מיה פור%'
       and (body like '%הזמנה%' or body like '%רכישה%')
  ) then
    raise exception '[vocab-gaps] no row says how to order a MIA FOUR';
  end if;

  raise notice '[vocab-gaps] financing and ordering answer to the words buyers use.';
end
$vocab$;
