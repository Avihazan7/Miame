-- 20260902_knowledge_zzzzzzz_sell_one_thing.rollback.sql
--
-- ⚠️ THIS REINSTATES TWO OFFERS THE BUSINESS CANNOT HONOUR. Running it puts back
--    rows that tell a buyer MiaMe rents MIA FOUR by the hour (₪50/100/180/245) and
--    that they can become a MiaMe Hub operator for a 13% success fee. Neither
--    product exists — the owner removed both on 2026-09-02.
--
--    A visitor ACTS on an answer. Restore these only if rental and the partner
--    programme genuinely return as products, and then restore the pages, the
--    components and the navigation with them — the rows alone would answer
--    questions about surfaces that are still 410.
--
-- The two bodies below were md5-checked against the LIVE rows before the forward
-- migration was applied and matched byte-for-byte:
--     rental   1aef2aa964b6b4bddb6832cb7c1860b2
--     partner  e15706153fa2464d6cd76a9fb5112ba1
-- (recorded at removal; see the phase evidence for the measurement).

do $sell_one_rb$
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[sell-one-thing/rollback] public.knowledge absent - skipped.';
    return;
  end if;

  insert into public.knowledge (id, source, category, body)
  values
    ('rental', 'MiaMe/Hub', 'rental',
     $b$השכרת מיה פור: החל מ-50 ש"ח לשעה (50/100/180/245 ל-1/3/6/9 שעות) דרך רשת MiaMe Hub.$b$),
    ('partner', 'MiaMe/Hub', 'partner',
     $b$מודל שותף MiaMe Hub: השותף מחזיק את הצי, MiaMe מביאה ביקוש; 13% Success Fee מהפניות בלבד, ללא עלות קבועה.$b$)
  on conflict (id) do update
    set source = excluded.source, category = excluded.category,
        body = excluded.body, embedding = null, updated_at = now();

  raise notice '[sell-one-thing/rollback] two unofferable products are live again.';
end
$sell_one_rb$;
