-- Rollback for 20260901_knowledge_spyqe_and_supply.sql
--
-- Removes the six SPYQE rows and restores the previous `delivery` and `lead` bodies
-- ("אספקה מיידית, בכפוף לזמינות מלאי."), which is what 20260629_knowledge_seed_miame
-- and the 20260714 full seed both carry.
--
-- The DELETE is keyed by an explicit id list, never unqualified.

do $rb$
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[knowledge-spyqe/rollback] public.knowledge absent - skipped.';
    return;
  end if;

  delete from public.knowledge
   where id in ('spyqe-what','spyqe-price','spyqe-delivery','spyqe-spec','spyqe-spec-missing','spyqe-register');

  update public.knowledge set body = 'אספקה מיידית, בכפוף לזמינות מלאי.'
   where id = 'delivery';

  -- `lead` is NOT restored to its prior text, deliberately. That text described a
  -- balloon payment the simulator does not offer and never did in this codebase
  -- (Configurator pins balloonPct to 0). A rollback may undo a business decision;
  -- it may not reinstate a factual error. The corrected wording stands.
  update public.knowledge set body =
    'פנייה ועסקה דרך WhatsApp: הסימולטור שולח הצעה מלאה - דגם, מקדמה, מספר תשלומים ותשלום חודשי - ישירות לוואטסאפ.'
   where id = 'lead';

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'knowledge' and column_name = 'embedding'
  ) then
    execute $sql$ update public.knowledge set embedding = null where id in ('delivery','lead') $sql$;
  end if;
end $rb$;
