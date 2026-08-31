-- Rollback for 20260831_knowledge_sales_campaign_alignment.sql
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
    'יצירת קשר: וואטסאפ ישיר באתר (כפתור "דברו איתי"), או דרך חנות הדגל והמשווקים המורשים.'
    where id = 'contact';

  update public.knowledge set body =
    'רשת משווקים מורשים בכל הארץ (הוד-השרון, תל אביב, ירושלים, אשקלון, אילת ועוד) — חיוג וניווט באתר.'
    where id = 'dealers';

  update public.knowledge set body =
    'יבואן רשמי MEU · Mayer Electric Utilities; חנות דגל אליעזר קפלן 21 תל אביב; שירות וחלפים ארצי.'
    where id = 'service';

  update public.knowledge set body =
    'מסלולי תשלום ב-0% ריבית בכפוף לאישור; עד 26 תשלומים במסלול פרטי. הסימולטור באתר בונה הצעה תוך דקה.'
    where id = 'finance';

  update public.knowledge set body =
    'הסימולטור באתר: בוחרים דגם ומסלול (פרטי/עסקי/שותף), גוררים מקדמה/בלון/תקופה, ומקבלים תשלום חודשי משוער מיידי.'
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
