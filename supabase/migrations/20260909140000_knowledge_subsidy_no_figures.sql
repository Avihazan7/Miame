-- 20260909140000_knowledge_subsidy_no_figures.sql
-- MiaMe · Brain RAG · the corpus stops quoting Ministry of Defence figures.
--
-- OWNER DECISION, 2026-09-09: "להסיר מספרים לגמרי" — the brain answers that the
-- eligibility tracks exist and that we check them personally, and points to the two
-- official mod.gov.il pages. It quotes no percentage and no sum.
--
-- WHY THIS IS A CORRECTNESS FIX AND NOT A STYLE CHOICE
--   components/Tribute.tsx carries the legally reviewed and frozen wording, and the
--   corpus did not match it. Measured 2026-09-09:
--     the page  : "עד 100% מוכר לסבסוד*", where the asterisk resolves to
--                 "סבסוד מוכר של עד 90% ממחיר הקלנועית, בתוספת מענק ההוקרה של MEU
--                  בשיעור 10%"
--     the corpus: "עד 100% מוכר לסבסוד מימון הקלנועית"
--   The corpus row therefore told a disabled veteran that the Ministry of Defence
--   RECOGNISES the full price, when the reviewed text says it recognises up to 90%
--   and the remaining tenth is a discretionary importer gift that "ניתן לשינוי או
--   להפסקה בכל עת". The bereaved-families row was missing three material conditions
--   the page states — "קלנועית יחיד", "פעם ב־4 שנים", "לאלמן/ה".
--
--   A retrieval corpus is quoted to a buyer as an answer. On entitlement content the
--   only safe failure mode is saying less, so the numbers come out entirely rather
--   than being restated more carefully: a figure the brain does not hold is a figure
--   it cannot get wrong, and the two official pages are where the real numbers live.
--   THE SITE IS UNCHANGED — Tribute.tsx keeps its reviewed figures. This narrows what
--   the CHAT says, nothing else.
--
-- The embedding is dropped with the text, per
-- 20260831_knowledge_sales_campaign_alignment.sql: "a stale vector for a rewritten
-- body is a lie the retriever cannot see."
--
-- REPLAY ORDER: after 20260831_knowledge_sales_campaign_alignment.sql.

update public.knowledge
   set body = $b$נכי צה"ל וכוחות הביטחון — אגף השיקום במשרד הביטחון: קיים מסלול לרכישת קלנועית במימון משרד הביטחון, בהתאם לזכאות הרפואית והתפקודית. שיעור הסבסוד ותנאי הזכאות נקבעים על ידי משרד הביטחון בלבד, ונדרש אישור עקרוני לזכאות לפני הרכישה. בנוסף, MEU — היבואן הרשמי — מעניק מענק מתנה והוקרה להשלמת העלות; זו הטבת רשות בכפוף לאישור זכאות, למלאי ולתנאי המבצע, וניתן לשנותה או להפסיקה בכל עת. אנחנו מלווים את התהליך מול האגף. לבדיקה אישית בלי התחייבות פנו אלינו בוואטסאפ. פרטי הזכאות הרשמיים: shikum.mod.gov.il/medical/equipment/wheelchairs$b$,
       embedding = null,
       updated_at = now()
 where id = 'subsidy-disabled';

update public.knowledge
   set body = $b$בני משפחות שכולות — אגף משפחות והנצחה במשרד הביטחון: קיים מסלול מענק לרכישת קלנועית. גובה המענק, תדירותו, מי זכאי לו ותנאי הזכאות נקבעים על ידי משרד הביטחון בלבד, ונדרש אישור עקרוני לזכאות לפני הרכישה. בנוסף, MEU — היבואן הרשמי — מעניק מענק מתנה והוקרה להשלמת העלות; זו הטבת רשות בכפוף לאישור זכאות, למלאי ולתנאי המבצע, וניתן לשנותה או להפסיקה בכל עת. אנחנו מלווים את התהליך מול האגף. לבדיקה אישית בלי התחייבות פנו אלינו בוואטסאפ. פרטי הזכאות הרשמיים: mishpahot-hantzaha.mod.gov.il/transportation/scooter$b$,
       embedding = null,
       updated_at = now()
 where id = 'subsidy-bereaved';

-- POSTCONDITIONS — absolute, so a partial apply cannot report success.
do $$
declare
  r record;
begin
  for r in select id, body, embedding from public.knowledge
            where id in ('subsidy-disabled', 'subsidy-bereaved')
  loop
    -- NO DIGIT SURVIVES. This is the owner's decision expressed as a check a future
    -- edit cannot quietly undo: any percentage, any sum, any "4 שנים" fails the apply.
    if r.body ~ '[0-9]' then
      raise exception '[subsidy-no-figures] row % still carries a digit: %', r.id, r.body;
    end if;
    -- and the vector must go with the text
    if r.embedding is not null then
      raise exception '[subsidy-no-figures] row % kept a vector built from the old wording', r.id;
    end if;
    -- the official page must still be reachable from the answer
    if r.body not like '%mod.gov.il%' then
      raise exception '[subsidy-no-figures] row % no longer points at the official page', r.id;
    end if;
    -- and the answer must still send the buyer to a human
    if r.body not like '%וואטסאפ%' then
      raise exception '[subsidy-no-figures] row % no longer routes to a person', r.id;
    end if;
  end loop;
end $$;
