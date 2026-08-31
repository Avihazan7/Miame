-- 20260831_knowledge_sales_campaign_alignment.sql
-- MiaMe · Brain RAG · align the knowledge corpus with the focused sales campaign.
--
-- WHY
--   The corpus seeded by 20260714_knowledge_full_seed_from_crimson_lever.sql is
--   what the on-site Deal Assistant and answer engines quote. Five of its rows
--   now contradict the live site:
--
--     · contact   — routes people to "חנות הדגל והמשווקים המורשים"; the site no
--                   longer publishes a store or a dealer network.
--     · dealers   — a city-by-city dealer network with "חיוג וניווט באתר".
--     · service   — carries the flagship street address.
--     · simulator-how — describes three customer tracks and a balloon payment;
--                   the simulator now runs ONE track (down-payment + payments).
--     · finance   — says "עד 26 תשלומים", which was never true in this codebase:
--                   lib/finance.ts caps the term at 18 and every visible string
--                   on the site says 18. This row is a factual error that the
--                   brain has been free to quote, so it is corrected here.
--
--   The seed uses ON CONFLICT (id) DO NOTHING, so editing that historical file
--   would change nothing in a database that already has these rows. Correcting
--   live content therefore requires this forward migration.
--
-- SAFETY
--   · Guarded: no-op where public.knowledge does not exist.
--   · UPDATE-only, keyed by id — inserts nothing, deletes nothing, and touches
--     no row outside the five ids listed.
--   · Sets embedding back to NULL for every row it rewrites: a stale vector for
--     rewritten text is worse than none (retrieval degrades to keyword search).
--     Regenerate via POST /api/embed.
--
-- ROLLBACK: supabase/migrations/20260831_knowledge_sales_campaign_alignment.rollback.sql

do $align$
declare
  v_has_embedding boolean;
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[knowledge-align] public.knowledge absent — skipped.';
    return;
  end if;

  update public.knowledge set body =
    'יצירת קשר: וואטסאפ ישיר באתר (כפתור "דברו איתי"), או השארת פרטים בסימולטור התשלומים. אין סניפים ואין קווי טלפון נוספים — כל פנייה מגיעה לנציג MiaMe.'
    where id = 'contact';

  update public.knowledge set body =
    'מכירה ומסירה מתואמת בכל אזורי הארץ, מול נציג MiaMe. אין רשת סניפים ואין רשימת משווקים באתר.'
    where id = 'dealers';

  update public.knowledge set body =
    'יבואן רשמי MEU · Mayer Electric Utilities; אחריות יבואן רשמי, שירות וחלפים מקוריים. מסירה מתואמת בכל אזורי הארץ.'
    where id = 'service';

  update public.knowledge set body =
    'מסלולי תשלום ב-0% ריבית בכפוף לאישור עסקה; עד 18 תשלומים ללא ריבית והצמדה. הסימולטור באתר בונה הצעה תוך דקה.'
    where id = 'finance';

  update public.knowledge set body =
    'הסימולטור באתר מריץ מסלול אחד: בוחרים דגם, קובעים מקדמה וגוררים את מספר התשלומים (עד 18, ללא ריבית והצמדה), ומקבלים תשלום חודשי משוער מיידי.'
    where id = 'simulator-how';

  -- Invalidate the vectors of exactly the rows rewritten above, if the column exists.
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

  raise notice '[knowledge-align] 5 rows aligned with the sales campaign.';
end
$align$;
