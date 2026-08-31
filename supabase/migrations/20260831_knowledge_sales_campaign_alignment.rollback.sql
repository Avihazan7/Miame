-- Rollback for 20260831_knowledge_sales_campaign_alignment.sql
--
-- ⚠ NOT a byte-exact restore, deliberately. The pre-campaign bodies named a
--   flagship store at a street address. That store CLOSED (owner, 2026-08-31),
--   and the same bodies carried two figures that were never true in this codebase:
--   "26 תשלומים" (lib/finance.ts has always capped the term at 18) and a balloon
--   payment (Configurator pins balloonPct to 0). A rollback may undo a business
--   DECISION — the dealer network and the three customer tracks are restored in
--   full. It may not reinstate a factual ERROR, so those three are corrected.
--   so restoring those strings would republish a falsehood — the one thing a
--   rollback must never do. This file undoes the campaign rewrite while leaving
--   the closed address out; everything else returns to its prior wording.
--
-- Restores the five knowledge rows to the text seeded by
-- 20260714_knowledge_full_seed_from_crimson_lever.sql.
--
-- ⚠ NOTE: the 'finance' row's original text ("עד 26 תשלומים") is factually wrong
-- — lib/finance.ts caps the term at 18 and every visible string on the site says
-- 18. It is restored here only so that this rollback is a faithful inverse. If
-- you run this rollback, correct that row separately.

do $rb$
declare
  v_has_embedding boolean;
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[knowledge-align-rollback] public.knowledge absent — skipped.';
    return;
  end if;

  update public.knowledge set body =
    'יצירת קשר: וואטסאפ ישיר באתר (כפתור "דברו איתי"), או השארת פרטים בסימולטור התשלומים.'
    where id = 'contact';

  update public.knowledge set body =
    'רשת משווקים מורשים בכל הארץ (הוד-השרון, תל אביב, ירושלים, אשקלון, אילת ועוד) — חיוג וניווט באתר.'
    where id = 'dealers';

  update public.knowledge set body =
    'יבואן רשמי MEU · Mayer Electric Utilities; שירות וחלפים ארצי.'
    where id = 'service';

  update public.knowledge set body =
    'מסלולי תשלום ב-0% ריבית בכפוף לאישור; עד 18 תשלומים במסלול פרטי. הסימולטור באתר בונה הצעה תוך דקה.'
    where id = 'finance';

  update public.knowledge set body =
    'הסימולטור באתר: בוחרים דגם ומסלול (פרטי/עסקי/שותף), גוררים מקדמה ומספר תשלומים, ומקבלים תשלום חודשי משוער מיידי.'
    where id = 'simulator-how';

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'knowledge' and column_name = 'embedding'
  ) into v_has_embedding;

  if v_has_embedding then
    execute $sql$
      update public.knowledge set embedding = null
      where id in ('contact','dealers','service','finance','simulator-how')
    $sql$;
  end if;
end
$rb$;
