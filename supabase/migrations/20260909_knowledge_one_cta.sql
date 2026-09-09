-- 20260909_knowledge_one_cta.sql
-- MiaMe · Brain RAG · the corpus stops naming a button that no longer exists.
--
-- OWNER DECISION, 2026-09-09: the page now offers ONE call to action. The header's
-- WhatsApp button ("דברו איתי") and the WhatsApp button inside the mobile sticky bar
-- were both removed; what remains is a single centred "בדיקת התאמה" that scrolls to
-- the simulator.
--
-- WHY THIS IS A CORRECTNESS FIX AND NOT HOUSEKEEPING
--   The live `contact` row answers "how do I reach you" with:
--     "יצירת קשר: וואטסאפ ישיר באתר (כפתור "דברו איתי"), או השארת פרטים בסימולטור..."
--   That sentence now sends a visitor looking for a control that is not on the page.
--   It is the same defect class the 2026-09-09 audit found in brain/masters.ts, where
--   the concierge was still instructed to offer a rental and a partnership whose
--   corpus rows had already been deleted: an instruction with nothing behind it is
--   the condition under which a model invents the rest.
--
-- WHY REWRITE RATHER THAN DELETE
--   Unlike the rental and partner rows, the QUESTION still has a true answer — the
--   funnel did not go away, only one of its doorways. WhatsApp is still where a lead
--   converts: the Configurator hands the finished quote to it, lib/wa-cta still holds
--   the message registry, and the floating button is still on the page. So the row is
--   corrected to describe the route that exists, and stops naming a specific control.
--
-- REPLAY ORDER: after 20260831_knowledge_sales_campaign_alignment.sql, which last
-- wrote this row.

update public.knowledge
set body = $b$יצירת קשר: השארת פרטים בסימולטור ההתאמה באתר, או פנייה ישירה בוואטסאפ. אין סניפים ואין קווי טלפון נוספים — כל פנייה מגיעה לנציג MiaMe.$b$
where id = 'contact';

do $$
begin
  if exists (select 1 from public.knowledge where id = 'contact' and body like '%דברו איתי%') then
    raise exception '[one-cta] the contact row still names a button the site does not render';
  end if;
end $$;
