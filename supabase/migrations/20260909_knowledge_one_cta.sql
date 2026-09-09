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
-- WHY THE VECTOR IS DROPPED WITH THE TEXT
--   Retrieval here is vector-first with a Hebrew keyword fallback, so a row whose
--   body changed while its embedding did not is matched on wording it no longer
--   carries — 20260831_knowledge_sales_campaign_alignment.sql states the rule in one
--   line: "a stale vector for a rewritten body is a lie the retriever cannot see."
--   The first draft of THIS file omitted it, and that omission was not academic:
--   measured on the MiaMe project 2026-09-09, 41 of 41 rows carry a vector and the
--   `contact` row's encodes the sentence naming "דברו איתי". Nulling it drops the row
--   to the keyword fallback until the backfill runs — correct text on the slower path
--   beats a confident match on text the site no longer shows.
--   (scripts/knowledge-embed.mjs still says "30 of 30 rows carry no vector", measured
--   2026-08-31. That was true then; it is not true now. Re-measure, do not quote it.)
--
-- REPLAY ORDER: after 20260831_knowledge_sales_campaign_alignment.sql, which last
-- wrote this row.

update public.knowledge
   set body = $b$יצירת קשר: השארת פרטים בסימולטור ההתאמה באתר, או פנייה ישירה בוואטסאפ. אין סניפים ואין קווי טלפון נוספים — כל פנייה מגיעה לנציג MiaMe.$b$,
       embedding = null,
       updated_at = now()
 where id = 'contact';

-- POSTCONDITIONS — absolute, so a partial apply cannot report success.
do $$
begin
  if exists (select 1 from public.knowledge where id = 'contact' and body like '%דברו איתי%') then
    raise exception '[one-cta] the contact row still names a button the site does not render';
  end if;
  -- The vector must be gone too. Without this, an apply that rewrote the text and
  -- left the old embedding in place would report success and still mis-retrieve.
  if exists (select 1 from public.knowledge where id = 'contact' and embedding is not null) then
    raise exception '[one-cta] the contact row kept a vector built from the old wording';
  end if;
end $$;
