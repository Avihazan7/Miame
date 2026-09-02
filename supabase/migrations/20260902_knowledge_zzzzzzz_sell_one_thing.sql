-- 20260902_knowledge_zzzzzzz_sell_one_thing.sql
-- MiaMe · Brain RAG · the corpus offers only what the business actually sells.
--
-- OWNER DECISION, 2026-09-02: MiaMe markets and sells MIA FOUR — the קלנועית made by
-- MIA Dynamics (מיה דיינמיקס), imported to Israel by MEU. No rental. No business
-- partners. Nothing else.
--
-- WHY THIS IS A CORRECTNESS FIX AND NOT HOUSEKEEPING
--   Two rows in the LIVE corpus offered products that do not exist:
--     rental   "השכרת מיה פור: החל מ-50 ש\"ח לשעה (50/100/180/245 …) דרך רשת MiaMe Hub."
--     partner  "מודל שותף MiaMe Hub: … 13% Success Fee מהפניות בלבד, ללא עלות קבועה."
--   These are not stale marketing copy sitting on a page nobody opens. They are
--   ANSWERS the assistant gives a buyer who asks. A visitor acts on an answer —
--   they plan around an hourly rate, or they write in asking to become an operator.
--   Publishing an offer that cannot be honoured is worse than publishing nothing,
--   and it is the one failure mode a knowledge corpus is uniquely able to cause.
--
--   The same decision removed /partners (which sat in the header nav), /rent-eilat,
--   five components, three modules, the homepage FAQ entry that explained how to
--   become a MiaMe Hub, and three offline answers in the assistant. Both URLs now
--   answer 410 Gone. This migration is the corpus half of that one change.
--
-- WHY DELETE RATHER THAN REWRITE
--   There is no true version of these rows. A row exists to answer a question; the
--   questions ("how much to rent", "how do I become a partner") no longer have an
--   answer this business can give. Rewriting them into "we do not offer that" would
--   keep two rows competing for retrieval against the rows that do sell something —
--   and IDF would spend their weight on a non-product.
--
-- REPLAY ORDER
--   "zzzzzzz" sorts after "zzzzzz" (entity vocabulary), so a fresh database seeds,
--   aligns, corrects, gains the definition rows, then loses these two — same end
--   state as live.
--
-- ROLLBACK: 20260902_knowledge_zzzzzzz_sell_one_thing.rollback.sql

do $sell_one$
declare
  removed int;
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[sell-one-thing] public.knowledge absent - skipped.';
    return;
  end if;

  delete from public.knowledge where id in ('rental', 'partner');
  get diagnostics removed = row_count;
  raise notice '[sell-one-thing] removed % row(s).', removed;

  -- Postconditions, absolute.

  -- 1 · Neither row may survive under any wording.
  if exists (select 1 from public.knowledge where id in ('rental', 'partner')) then
    raise exception '[sell-one-thing] a removed row is still present';
  end if;

  -- 2 · And no OTHER row may carry the offers either — the point is that the
  --     business does not sell these, not that two ids went away.
  if exists (
    select 1 from public.knowledge
     where body like '%MiaMe Hub%' or body like '%Success Fee%' or body like '%Green Extreme%'
  ) then
    raise exception '[sell-one-thing] a row still offers a rental or a partnership';
  end if;

  -- 3 · The corpus must still be able to sell the one thing it does sell. Without
  --     this, a delete that took the catalogue with it would pass the two above.
  if not exists (select 1 from public.knowledge where id = 'mia-four-what') then
    raise exception '[sell-one-thing] the product definition row is gone';
  end if;
  if (select count(*) from public.knowledge where category = 'pricing') < 3 then
    raise exception '[sell-one-thing] the pricing category no longer covers the range';
  end if;

  raise notice '[sell-one-thing] the corpus offers only what the business sells.';
end
$sell_one$;
