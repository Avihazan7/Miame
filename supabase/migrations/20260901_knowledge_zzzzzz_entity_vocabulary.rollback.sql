-- 20260901_knowledge_zzzzzz_entity_vocabulary.rollback.sql
--
-- ⚠️ THIS REINSTATES A MEASURED DEFECT. Removing these two rows returns the corpus
--    to a state where NO row answers "what is מיה פור", the manufacturer has no
--    Hebrew name anywhere (0 of 37 rows), and the product has no Latin one — so
--    those queries match nothing, silently.
--
--    Run it only to undo the migration, never to "clean up".
--
-- Both rows were INSERTED by the forward migration and existed in no prior state,
-- so deleting them is an exact undo rather than a guess at previous wording.

do $vocab_rb$
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[entity-vocab/rollback] public.knowledge absent - skipped.';
    return;
  end if;

  delete from public.knowledge where id in ('mia-four-what', 'manufacturer');

  raise notice '[entity-vocab/rollback] definition rows removed - the entity is unnameable again.';
end
$vocab_rb$;
