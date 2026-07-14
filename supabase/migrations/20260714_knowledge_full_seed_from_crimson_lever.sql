-- 20260714_knowledge_full_seed_from_crimson_lever.sql
-- MiaMe · Brain RAG · Full knowledge seed (30 rows) — provenance-tracked import.
--
-- PROVENANCE
--   Source of truth: live `public.knowledge` of Supabase project
--   `supabase-crimson-lever` (ref thhyfwoeybkptxvbpcmg), exported 2026-07-14 as
--   part of the infrastructure-hardening audit. Full export (incl. metadata):
--   leasing-api repo → archives/supabase/crimson-lever/knowledge.json.
--
-- WHY
--   The previous seed (20260629_knowledge_seed_miame.sql) covers only part of
--   the corpus the brain actually serves (17 ids, some divergent). This file
--   makes the WHOLE live corpus reproducible from git, so the brain can be
--   pointed at any database (e.g. after consolidating away crimson-lever)
--   without losing knowledge.
--
-- SAFETY / NO-DUPLICATES
--   · Guarded: no-op where the knowledge table does not exist.
--   · ON CONFLICT (id) DO NOTHING — never overwrites curated content or
--     embeddings that already exist in the target DB.
--   · Embeddings are NOT seeded (vector column stays NULL for new rows) —
--     regenerate via POST /api/embed (Voyage). Retrieval degrades gracefully to
--     keyword search until then.
--
-- ROLLBACK (manual): delete from public.knowledge where id in (...the 30 ids...);
--   (only removes rows this seed inserted; existing rows are never touched).

do $seed$
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[knowledge-seed] public.knowledge absent — skipped.';
    return;
  end if;

  insert into public.knowledge (id, source, category, body) values
    ('colors', 'MiaMe/Models', 'models', 'מיה פור זמינה בשחור פרימיום עם הדגשי תכלת.'),
    ('contact', 'MiaMe/Funnel', 'lead', 'יצירת קשר: וואטסאפ ישיר באתר (כפתור "דברו איתי"), או דרך חנות הדגל והמשווקים המורשים.'),
    ('dealers', 'MiaMe/Service', 'service', 'רשת משווקים מורשים בכל הארץ (הוד-השרון, תל אביב, ירושלים, אשקלון, אילת ועוד) — חיוג וניווט באתר.'),
    ('delivery', 'MiaMe/Service', 'service', 'אספקה מיידית, בכפוף לזמינות מלאי.'),
    ('finance', 'MiaMe/Finance', 'finance', 'מסלולי תשלום ב-0% ריבית בכפוף לאישור; עד 26 תשלומים במסלול פרטי. הסימולטור באתר בונה הצעה תוך דקה.'),
    ('lead', 'MiaMe/Funnel', 'lead', 'פנייה ועסקה דרך WhatsApp: הסימולטור שולח הצעה מלאה (דגם, מקדמה, בלון, תקופה, תשלום חודשי) ישירות לוואטסאפ.'),
    ('model-choose', 'MiaMe/Models', 'models', 'איך לבחור דגם: 4×2 לעיר וזריזות · 2×4 Long Range לטווח מורחב (35Ah) · 4×4 לארבעה מנועים והנעה כפולה בשטח.'),
    ('partner', 'MiaMe/Hub', 'partner', 'מודל שותף MiaMe Hub: השותף מחזיק את הצי, MiaMe מביאה ביקוש; 13% Success Fee מהפניות בלבד, ללא עלות קבועה.'),
    ('patent', 'MiaMe/Patents', 'specs', 'הפלטפורמה מוגנת פטנט — יציבות ובטיחות בארבעה גלגלים, יתרון ייחודי בשוק.'),
    ('portability', 'MiaMe/Specs', 'specs', 'שחרור מהיר של הכיסא וקיפול הכידון ביד אחת — אחסון ושינוע נוחים גם ברכב קטן.'),
    ('price-2x4lr', 'MiaMe/Models', 'pricing', 'מיה פור 2x4 Long Range (טווח מורחב 35Ah) — מחיר MiaMe החל מ-21,900 ש"ח.'),
    ('price-4x2', 'MiaMe/Models', 'pricing', 'מיה פור 4x2 (העירוני החכם) — מחיר MiaMe החל מ-19,900 ש"ח.'),
    ('price-4x4', 'MiaMe/Models', 'pricing', 'מיה פור 4x4 (4 מנועים, הנעה כפולה לשטח) — מחיר MiaMe החל מ-27,900 ש"ח.'),
    ('rental', 'MiaMe/Hub', 'rental', 'השכרת מיה פור: החל מ-50 ש"ח לשעה (50/100/180/245 ל-1/3/6/9 שעות) דרך רשת MiaMe Hub.'),
    ('service', 'MiaMe/Service', 'service', 'יבואן רשמי MEU · Mayer Electric Utilities; חנות דגל אליעזר קפלן 21 תל אביב; שירות וחלפים ארצי.'),
    ('simulator-how', 'MiaMe/Finance', 'finance', 'הסימולטור באתר: בוחרים דגם ומסלול (פרטי/עסקי/שותף), גוררים מקדמה/בלון/תקופה, ומקבלים תשלום חודשי משוער מיידי.'),
    ('spec-battery', 'MiaMe/Specs', 'specs', 'סוללת ליתיום נשלפת 60V, קיבולת 25/35Ah, תאי LG 21700, משקל כ-6.3 ק"ג.'),
    ('spec-brakes', 'MiaMe/Specs', 'specs', 'בלמים: דיסק הידראולי כפול 140 מ"מ; מערכת מתלים מלאה קדמית ואחורית, פלטפורמה מוגנת פטנט.'),
    ('spec-motor', 'MiaMe/Specs', 'specs', '2 או 4 מנועי BLDC, 1,800W כל אחד.'),
    ('spec-range', 'MiaMe/Specs', 'specs', 'טווח שימוש ריאלי עד 100 ק"מ; נתון יצרן עד 120 ק"מ (תנאי מעבדה).'),
    ('spec-speed', 'MiaMe/Specs', 'specs', 'מהירות מרבית 12 קמ"ש; תקן EN17128, מותאם לתקנות הקלנועית בישראל.'),
    ('spec-weight', 'MiaMe/Specs', 'specs', 'משקל הכלי 42 ק"ג (דגם 4x2); עומס מרבי עד 136 ק"ג.'),
    ('subsidy-bereaved', 'MiaMe/Tribute', 'subsidy', 'בני משפחות שכולות: מענק עד 17,988 ש"ח (עד כ-90% מהעלות) בתוספת מענק הוקרה MEU 10% — בכפוף לאישור אגף משפחות והנצחה.'),
    ('subsidy-disabled', 'MiaMe/Tribute', 'subsidy', 'נכי צה"ל וכוחות הביטחון (אגף השיקום): עד 100% מוכר לסבסוד מימון הקלנועית, בכפוף לאישור משרד הביטחון.'),
    ('suspension', 'MiaMe/Specs', 'specs', 'מערכת מתלים מכנית מלאה, שיכוך קדמי ואחורי — נסיעה יציבה ובטוחה בכל תוואי.'),
    ('testride', 'MiaMe/Funnel', 'lead', 'אפשר לתאם נסיעת מבחן — פנו אלינו בוואטסאפ ונקבע מועד.'),
    ('use-commute', 'MiaMe/Lifestyle', 'usecase', 'אידיאלי לתחבורה עירונית יומיומית — מהיר מאוטובוס, חניה בכל מקום, אפס דלק ואחזקה מינימלית.'),
    ('use-delivery', 'MiaMe/Lifestyle', 'usecase', 'מתאים לשילוח אחרון-מייל ולוגיסטיקה — פלטפורמה יציבה, נשיאת עומס עד 136 ק"ג.'),
    ('use-tourism', 'MiaMe/Lifestyle', 'usecase', 'מתאים לסיורים ותיירות — ישיבה נוחה, יציבות ארבעה גלגלים וטווח גבוה ליום שלם.'),
    ('warranty', 'MiaMe/Service', 'service', 'אחריות וגיבוי של יבואן רשמי MEU · Mayer Electric Utilities, חמישה עשורים בענף הרכב.')
  on conflict (id) do nothing;

  raise notice '[knowledge-seed] full corpus ensured (30 ids, existing rows untouched).';
end
$seed$;
