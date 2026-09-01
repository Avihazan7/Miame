-- 20260901_knowledge_zz_spyqe_hebrew_name.sql
-- MiaMe · Brain RAG · give SPYQE its Hebrew name in the corpus it is sold from.
--
-- WHY — MEASURED, 2026-09-01, on the live database:
--     rows containing "ספייק" ... 0
--     rows containing "SPYQE" ... 7
--
--   Retrieval is currently the Hebrew keyword path (every embedding is NULL), and
--   it matches on the BODY text. A buyer typing ספייק — the natural Hebrew form,
--   and the one the site itself prints (lib/spyqe.ts nameHe) — matched no SPYQE
--   row at all, so the retriever handed back MIA FOUR rows instead: the exact
--   cross-model answer the SPYQE rows were written to prevent. This was raised by
--   the triangle audit and re-verified independently before writing this file.
--
-- WHAT
--   Rewrites the seven bodies that name SPYQE so the FIRST mention reads
--   "SPYQE (ספייק)" — both names, matchable from either script. Full-body
--   rewrites, not string surgery: deterministic and idempotent.
--   Embeddings are reset for the rewritten rows (all are NULL today anyway):
--   a vector of the old text must not survive the new text.
--
-- REPLAY ORDER
--   Sorts after 20260901_knowledge_spyqe_and_supply.sql ("...zz..." > "...spyqe..."),
--   which inserts these rows on a fresh database; this file then adds the Hebrew
--   name there too. Guarded by test/migrationsGate.test.ts.
--
-- ROLLBACK: 20260901_knowledge_zz_spyqe_hebrew_name.rollback.sql

do $spyqe_he$
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[spyqe-hebrew] public.knowledge absent - skipped.';
    return;
  end if;

  update public.knowledge
     set body = $b$מיה פור נמצאת במלאי. האספקה אליכם עד 3 ימי עסקים, בכפוף לזמינות מלאי, בכל אזור בארץ ובמסירה מתואמת מראש. זמן האספקה של SPYQE (ספייק) שונה - הוא דגם בהזמנה מוקדמת.$b$,
         embedding = null,
         updated_at = now()
   where id = 'delivery';

  update public.knowledge
     set body = $b$אספקת SPYQE (ספייק) משוערת עד 33 ימי עסקים, מהמשלוח הראשון לישראל. זו הערכה ולא התחייבות, והיא שונה מזמן האספקה של מיה פור שנמצאת במלאי.$b$,
         embedding = null,
         updated_at = now()
   where id = 'spyqe-delivery';

  update public.knowledge
     set body = $b$SPYQE (ספייק) בהזמנה מוקדמת: מקדמה 1,000 ש"ח ליבואן בהרשמה, והיתרה 9,990 ש"ח ב-18 תשלומים של 555 ש"ח שמתחילים עם הגעת המשלוח למחסני היבואן. סה"כ 10,990 ש"ח במקום מחיר יבואן 11,990 ש"ח, ללא ריבית והצמדה. ההטבה ל-248 הזוכים הראשונים. זהו מחיר SPYQE בלבד ואינו מחיר מיה פור.$b$,
         embedding = null,
         updated_at = now()
   where id = 'spyqe-price';

  update public.knowledge
     set body = $b$הרשמה להזמנה מוקדמת של SPYQE (ספייק) נעשית בוואטסאפ דרך האתר. ההרשמה שומרת מקום במשלוח הראשון ואינה מחייבת ברכישה.$b$,
         embedding = null,
         updated_at = now()
   where id = 'spyqe-register';

  update public.knowledge
     set body = $b$מפרט SPYQE (ספייק) לפי היצרן: מנוע BLDC כפול מסוג גלגל, מהירות מרבית 25 קמ"ש (תקרת הקלנועית בישראל), טווח עד 50 ק"מ לסוללה, סוללה 20Ah נשלפת, בלמי דיסק הידראוליים כפולים, גלגלים 12 אינץ, מידות 562 על 1225 על 1248 מ"מ, גובה מקופל 439 מ"מ, תקן EN17128. אלה נתוני SPYQE ולא של מיה פור.$b$,
         embedding = null,
         updated_at = now()
   where id = 'spyqe-spec';

  update public.knowledge
     set body = $b$עבור SPYQE (ספייק) טרם פורסמו משקל הכלי, עומס מרבי, זמן טעינה, מתח סוללה והספק מנוע בוואט. אין למסור עבורם מספר, ובפרט אין להשתמש בנתוני מיה פור. התשובה הנכונה היא שהנתון יפורסם כשיאומת.$b$,
         embedding = null,
         updated_at = now()
   where id = 'spyqe-spec-missing';

  update public.knowledge
     set body = $b$SPYQE (ספייק) הוא הדגם השני על פלטפורמת MIA Dynamics, לצד מיה פור. הוא נמכר בהזמנה מוקדמת לקראת המשלוח הראשון לישראל.$b$,
         embedding = null,
         updated_at = now()
   where id = 'spyqe-what';

  -- Postcondition: no row may name SPYQE in Latin only. Absolute, so a replay on a
  -- fresh database fails loudly if a future seed reintroduces the gap.
  if exists (
    select 1 from public.knowledge
    where body ilike '%spyqe%' and body not like '%ספייק%'
  ) then
    raise exception '[spyqe-hebrew] a row still names SPYQE without ספייק';
  end if;

  raise notice '[spyqe-hebrew] 7 rows now carry both names.';
end
$spyqe_he$;
