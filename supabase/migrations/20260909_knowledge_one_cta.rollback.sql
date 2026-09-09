-- rollback for 20260909_knowledge_one_cta.sql — restores the wording that
-- 20260831_knowledge_sales_campaign_alignment.sql last wrote. Only correct while the
-- header's "דברו איתי" button exists; it does not today.
update public.knowledge
set body = $b$יצירת קשר: וואטסאפ ישיר באתר (כפתור "דברו איתי"), או השארת פרטים בסימולטור התשלומים. אין סניפים ואין קווי טלפון נוספים — כל פנייה מגיעה לנציג MiaMe.$b$
where id = 'contact';
