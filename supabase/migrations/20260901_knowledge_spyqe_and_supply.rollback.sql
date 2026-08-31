-- Rollback for 20260901_knowledge_spyqe_and_supply.sql
--
-- Removes the five SPYQE rows and restores the previous `delivery` body verbatim
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

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'knowledge' and column_name = 'embedding'
  ) then
    execute $sql$ update public.knowledge set embedding = null where id = 'delivery' $sql$;
  end if;
end $rb$;
