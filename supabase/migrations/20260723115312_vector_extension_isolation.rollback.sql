-- Rollback for 20260723115312_vector_extension_isolation.sql
--
-- ⚠ Moving pgvector back into `public` re-opens the Supabase advisor finding
-- (extension_in_public) this migration closed. Unwind a bad apply with it, not
-- as routine cleanup — and re-run the forward migration afterwards.
--
-- The function is recreated against the `public`-schema type so it stays
-- consistent with the extension's location.

do $iso$
begin
  if exists (
    select 1 from pg_extension e
      join pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'vector' and n.nspname <> 'public'
  ) then
    execute 'alter extension vector set schema public';
  end if;
end
$iso$;

create or replace function public.match_knowledge(
  query_embedding vector,
  match_count integer default 4
)
returns table(id text, source text, body text, similarity double precision)
language sql
stable
set search_path = public, pg_temp
as $function$
  select k.id, k.source, k.body,
         1 - (k.embedding <=> query_embedding) as similarity
  from public.knowledge k
  where k.embedding is not null
  order by k.embedding <=> query_embedding
  limit match_count;
$function$;
