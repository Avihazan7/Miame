-- 20260909150000_knowledge_spyqe_warranty_unpublished.sql
-- MiaMe · Brain RAG · SPYQE's unpublished-fields row names ALL of them.
--
-- THE DEFECT, MEASURED 2026-09-09 ON THE LIVE 40-ROW CORPUS:
--
--   "מה האחריות על ספייק"  →  warranty:4.27 | service:4.19 | spyqe-register:2.83
--
-- The top two documents are MIA FOUR's warranty — "תקופת האחריות היא שנה
-- (12 חודשים)" — so a buyer asking about SPYQE's warranty is answered out of the
-- other vehicle's, at roughly twice the price. lib/spyqe.ts is explicit that this
-- must not happen:
--
--   "Battery voltage, charge time, weight, load, motor watts, IP rating and
--    warranty term have NO field here … MIA FOUR's numbers are not SPYQE's"
--
-- That is SEVEN withheld fields. The `spyqe-spec-missing` row — which exists for
-- exactly this purpose, and whose own comment says it is "the refusal … itself a
-- fact worth retrieving" — lists only FIVE. אחריות and דירוג IP were never in it,
-- so nothing in the corpus told the retriever that a SPYQE warranty question has
-- no answer, and the nearest row that did carry "אחריות" won.
--
-- MEASURED AFTER, on the same live rows:
--   "מה האחריות על ספייק"  →  spyqe-spec-missing (first), warranty second.
--
-- ⚠ AND ONE HALF OF THIS IS NOT FIXED, deliberately, because a corpus edit cannot
--   fix it. The mirror question still misroutes:
--     "כמה זמן אחריות למיה פור"  →  spyqe-what / spyqe-spec-missing, not warranty
--   The cause is structural: every SPYQE row carries the words "מיה פור" inside its
--   own disclaimer ("אינו מחיר מיה פור", "ולא של מיה פור"), so a MIA FOUR query
--   scores the SPYQE rows highly. Naming the product inside the `warranty` row was
--   measured and did NOT fix it — it only made the bare "מה האחריות" worse. The
--   real fix is in the scorer (a product name inside a negation clause should not
--   earn the weight of one in a claim), which is a change to brain/knowledge.ts and
--   not to a row. Recorded here rather than half-attempted.
--
-- The embedding is dropped with the text, per 20260831_knowledge_sales_campaign_alignment.
--
-- REPLAY ORDER: after 20260831210536_knowledge_spyqe_and_supply.sql.

update public.knowledge
   set body = $b$עבור SPYQE (ספייק) טרם פורסמו משקל הכלי, עומס מרבי, זמן טעינה, מתח סוללה, הספק מנוע בוואט, דירוג אטימות IP ותקופת האחריות. אין למסור עבורם מספר, ובפרט אין להשתמש בנתוני מיה פור — גם לא בתקופת האחריות שלה. התשובה הנכונה היא שהנתון יפורסם כשיאומת.$b$,
       embedding = null,
       updated_at = now()
 where id = 'spyqe-spec-missing';

-- POSTCONDITIONS — absolute, so a partial apply cannot report success.
do $$
declare
  b text;
  v boolean;
begin
  select body, embedding is null into b, v from public.knowledge where id = 'spyqe-spec-missing';
  if b is null then
    raise exception '[spyqe-warranty] the spyqe-spec-missing row is gone';
  end if;
  -- all seven withheld fields lib/spyqe.ts names must appear
  if b not like '%אחריות%' then
    raise exception '[spyqe-warranty] the row still does not name the warranty term';
  end if;
  if b not like '%IP%' then
    raise exception '[spyqe-warranty] the row still does not name the IP rating';
  end if;
  if b not like '%משקל%' or b not like '%עומס%' or b not like '%טעינה%'
     or b not like '%מתח%' or b not like '%הספק%' then
    raise exception '[spyqe-warranty] the row lost one of the five fields it already had';
  end if;
  -- and it must still refuse rather than answer
  if b not like '%אין למסור%' then
    raise exception '[spyqe-warranty] the row stopped refusing';
  end if;
  if not v then
    raise exception '[spyqe-warranty] the row kept a vector built from the old wording';
  end if;
end $$;
