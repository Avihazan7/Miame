-- rollback for 20260909140000_knowledge_subsidy_no_figures.sql
--
-- Restores the wording 20260831_knowledge_sales_campaign_alignment.sql last wrote.
--
-- ⚠ READ BEFORE RUNNING. The text below is the reason the forward migration exists:
-- "עד 100% מוכר לסבסוד" states that the Ministry of Defence recognises the full
-- price, while components/Tribute.tsx — legally reviewed and frozen — says the
-- recognised subsidy is up to 90% and the remaining tenth is a discretionary
-- importer grant. Running this rollback puts that back in front of buyers.
-- Undo the DECISION with the owner before undoing the migration.
--
-- The vector is invalidated in both directions: undoing a body change leaves the
-- same text/vector mismatch the forward migration was written to prevent.
update public.knowledge
   set body = $b$נכי צה"ל וכוחות הביטחון (אגף השיקום): עד 100% מוכר לסבסוד מימון הקלנועית, בכפוף לאישור משרד הביטחון.$b$,
       embedding = null,
       updated_at = now()
 where id = 'subsidy-disabled';

update public.knowledge
   set body = $b$בני משפחות שכולות: מענק עד 17,988 ש"ח (עד כ-90% מהעלות) בתוספת מענק הוקרה MEU 10% — בכפוף לאישור אגף משפחות והנצחה.$b$,
       embedding = null,
       updated_at = now()
 where id = 'subsidy-bereaved';
