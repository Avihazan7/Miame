-- 20260901_knowledge_spyqe_and_supply.sql
-- MiaMe · Brain RAG · teach the assistant about SPYQE, and correct MIA FOUR supply.
--
-- WHY
--   Two models now, two different waits. MIA FOUR is in stock and ships in up to
--   3 business days; SPYQE is a pre-order whose first shipment is estimated at up
--   to 33 business days. The corpus knew about neither, so the assistant would
--   answer a SPYQE question out of MIA FOUR's rows.
--
-- THE RETRIEVAL HAZARD THIS IS DESIGNED AROUND
--   Every row's embedding is NULL, so retrieval runs entirely on the Hebrew
--   keyword fallback. The existing spec-* and price-* rows all describe MIA FOUR
--   and none of them says so. A buyer asking "מה המחיר" while looking at SPYQE
--   would be answered with 19,900-27,900. Therefore EVERY row below names its
--   model in the body text, not only in the id — the keyword path matches on the
--   body, so a model name that lives only in the id is invisible to it.
--
-- WHAT IS DELIBERATELY ABSENT
--   No SPYQE specification. None has been verified. `spyqe-spec` exists precisely
--   so the assistant has something correct to say when asked for one, instead of
--   reaching for MIA FOUR's numbers.
--
-- SAFETY
--   · Guarded: no-op where public.knowledge is absent.
--   · New rows use ON CONFLICT (id) DO NOTHING — never overwrites curated content.
--   · The one UPDATE is keyed by id and rewrites a row that is now factually wrong.
--   · Clears the embedding of the rewritten row only: a stale vector for rewritten
--     text is worse than none.
--
-- ROLLBACK: 20260901_knowledge_spyqe_and_supply.rollback.sql

do $spyqe$
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[knowledge-spyqe] public.knowledge absent - skipped.';
    return;
  end if;

  insert into public.knowledge (id, source, category, body) values
    ('spyqe-what', 'MiaMe/Spyqe', 'models',
     'SPYQE הוא הדגם השני על פלטפורמת MIA Dynamics, לצד מיה פור. הוא נמכר בהזמנה מוקדמת לקראת המשלוח הראשון לישראל.'),
    ('spyqe-price', 'MiaMe/Spyqe', 'finance',
     'SPYQE בהזמנה מוקדמת: מקדמה 1,000 ש"ח ליבואן בהרשמה, והיתרה 9,990 ש"ח ב-18 תשלומים של 555 ש"ח שמתחילים עם הגעת המשלוח למחסני היבואן. סה"כ 10,990 ש"ח במקום מחיר יבואן 11,990 ש"ח, ללא ריבית והצמדה. ההטבה ל-248 הזוכים הראשונים. זהו מחיר SPYQE בלבד ואינו מחיר מיה פור.'),
    ('spyqe-delivery', 'MiaMe/Spyqe', 'service',
     'אספקת SPYQE משוערת עד 33 ימי עסקים, מהמשלוח הראשון לישראל. זו הערכה ולא התחייבות, והיא שונה מזמן האספקה של מיה פור שנמצאת במלאי.'),
    ('spyqe-spec', 'MiaMe/Spyqe', 'models',
     'מפרט SPYQE לפי היצרן: מנוע BLDC כפול מסוג גלגל, מהירות מרבית 25 קמ"ש (תקרת הקלנועית בישראל), טווח עד 50 ק"מ לסוללה, סוללה 20Ah נשלפת, בלמי דיסק הידראוליים כפולים, גלגלים 12 אינץ, מידות 562 על 1225 על 1248 מ"מ, גובה מקופל 439 מ"מ, תקן EN17128. אלה נתוני SPYQE ולא של מיה פור.'),
    ('spyqe-spec-missing', 'MiaMe/Spyqe', 'models',
     'עבור SPYQE טרם פורסמו משקל הכלי, עומס מרבי, זמן טעינה, מתח סוללה והספק מנוע בוואט. אין למסור עבורם מספר, ובפרט אין להשתמש בנתוני מיה פור. התשובה הנכונה היא שהנתון יפורסם כשיאומת.'),
    ('spyqe-register', 'MiaMe/Spyqe', 'lead',
     'הרשמה להזמנה מוקדמת של SPYQE נעשית בוואטסאפ דרך האתר. ההרשמה שומרת מקום במשלוח הראשון ואינה מחייבת ברכישה.')
  on conflict (id) do nothing;

  -- `lead` still describes a balloon payment. The simulator HAS no balloon — it
  -- was removed, and components/Configurator.tsx pins balloonPct to 0. The
  -- assistant has been free to quote a term of the deal that does not exist.
  update public.knowledge set body =
    'פנייה ועסקה דרך WhatsApp: הסימולטור שולח הצעה מלאה - דגם, מקדמה, מספר תשלומים ותשלום חודשי - ישירות לוואטסאפ.'
    where id = 'lead';

  -- MIA FOUR's supply. The old body said only "אספקה מיידית", which is both
  -- vaguer and less useful than the commitment the business actually makes.
  update public.knowledge set body =
    'מיה פור נמצאת במלאי. האספקה אליכם עד 3 ימי עסקים, בכפוף לזמינות מלאי, בכל אזור בארץ ובמסירה מתואמת מראש. זמן האספקה של SPYQE שונה - הוא דגם בהזמנה מוקדמת.'
    where id = 'delivery';

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'knowledge' and column_name = 'embedding'
  ) then
    execute $sql$ update public.knowledge set embedding = null where id in ('delivery','lead') $sql$;
  end if;
end $spyqe$;
