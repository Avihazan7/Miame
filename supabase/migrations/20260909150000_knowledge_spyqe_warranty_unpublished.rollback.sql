-- rollback for 20260909150000_knowledge_spyqe_warranty_unpublished.sql
--
-- ⚠ Restores the five-field list. Measured on the live corpus, that state answers
-- "מה האחריות על ספייק" out of MIA FOUR's warranty row (12 months) — a different
-- vehicle at roughly twice the price. lib/spyqe.ts names seven withheld fields.
-- The vector is invalidated in both directions.
update public.knowledge
   set body = $b$עבור SPYQE (ספייק) טרם פורסמו משקל הכלי, עומס מרבי, זמן טעינה, מתח סוללה והספק מנוע בוואט. אין למסור עבורם מספר, ובפרט אין להשתמש בנתוני מיה פור. התשובה הנכונה היא שהנתון יפורסם כשיאומת.$b$,
       embedding = null,
       updated_at = now()
 where id = 'spyqe-spec-missing';
