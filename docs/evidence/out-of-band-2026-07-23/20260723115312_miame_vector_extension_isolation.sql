alter extension vector set schema extensions;

create or replace function public.match_knowledge(
  query_embedding extensions.vector,
  match_count integer default 4
)
returns table(id text, source text, body text, similarity double precision)
language sql
stable
set search_path = pg_catalog
as $function$
  select k.id, k.source, k.body,
         1 - (k.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.knowledge k
  where k.embedding is not null
  order by k.embedding operator(extensions.<=>) query_embedding
  limit match_count;
$function$;