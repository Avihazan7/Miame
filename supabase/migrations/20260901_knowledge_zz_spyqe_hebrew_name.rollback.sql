-- Rollback for 20260901_knowledge_zz_spyqe_hebrew_name.sql
-- Restores the seven bodies exactly as they were before the Hebrew name was added
-- (byte-for-byte, captured from the live database on 2026-09-01), and clears the
-- rewritten rows' embeddings. Running this reinstates a MEASURED retrieval gap:
-- a Hebrew "ספייק" query stops matching any SPYQE row.

do $rb$
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[spyqe-hebrew/rollback] public.knowledge absent - skipped.';
    return;
  end if;

  update public.knowledge
     set body = $b$מיה פור נמצאת במלאי. האספקה אליכם עד 3 ימי עסקים, בכפוף לזמינות מלאי, בכל אזור בארץ ובמסירה מתואמת מראש. זמן האספקה של SPYQE שונה - הוא דגם בהזמנה מוקדמת.$b$,
         embedding = null,
         updated_at = now()
   where id = 'delivery';

  update public.knowledge
     set body = $b$אספקת SPYQE משוערת עד 33 ימי עסקים, מהמשלוח הראשון לישראל. זו הערכה ולא התחייבות, והיא שונה מזמן האספקה של מיה פור שנמצאת במלאי.$b$,
         embedding = null,
         updated_at = now()
   where id = 'spyqe-delivery';

  update public.knowledge
     set body = $b$SPYQE בהזמנה מוקדמת: מקדמה 1,000 ש"ח ליבואן בהרשמה, והיתרה 9,990 ש"ח ב-18 תשלומים של 555 ש"ח שמתחילים עם הגעת המשלוח למחסני היבואן. סה"כ 10,990 ש"ח במקום מחיר יבואן 11,990 ש"ח, ללא ריבית והצמדה. ההטבה ל-248 הזוכים הראשונים. זהו מחיר SPYQE בלבד ואינו מחיר מיה פור.$b$,
         embedding = null,
         updated_at = now()
   where id = 'spyqe-price';

  update public.knowledge
     set body = $b$הרשמה להזמנה מוקדמת של SPYQE נעשית בוואטסאפ דרך האתר. ההרשמה שומרת מקום במשלוח הראשון ואינה מחייבת ברכישה.$b$,
         embedding = null,
         updated_at = now()
   where id = 'spyqe-register';

  update public.knowledge
     set body = $b$מפרט SPYQE לפי היצרן: מנוע BLDC כפול מסוג גלגל, מהירות מרבית 25 קמ"ש (תקרת הקלנועית בישראל), טווח עד 50 ק"מ לסוללה, סוללה 20Ah נשלפת, בלמי דיסק הידראוליים כפולים, גלגלים 12 אינץ, מידות 562 על 1225 על 1248 מ"מ, גובה מקופל 439 מ"מ, תקן EN17128. אלה נתוני SPYQE ולא של מיה פור.$b$,
         embedding = null,
         updated_at = now()
   where id = 'spyqe-spec';

  update public.knowledge
     set body = $b$עבור SPYQE טרם פורסמו משקל הכלי, עומס מרבי, זמן טעינה, מתח סוללה והספק מנוע בוואט. אין למסור עבורם מספר, ובפרט אין להשתמש בנתוני מיה פור. התשובה הנכונה היא שהנתון יפורסם כשיאומת.$b$,
         embedding = null,
         updated_at = now()
   where id = 'spyqe-spec-missing';

  update public.knowledge
     set body = $b$SPYQE הוא הדגם השני על פלטפורמת MIA Dynamics, לצד מיה פור. הוא נמכר בהזמנה מוקדמת לקראת המשלוח הראשון לישראל.$b$,
         embedding = null,
         updated_at = now()
   where id = 'spyqe-what';

  raise notice '[spyqe-hebrew/rollback] pre-change bodies restored.';
end
$rb$;
