-- Rollback for 20260704_lead_utm.sql
--
-- ⚠ DELIBERATELY NOT SYMMETRIC. It restores the POLICIES and drops the INDEX,
--   and it leaves the UTM columns in place.
--
--   Dropping them would be the "complete" undo and the wrong one: the client
--   insert (lib/supabase.ts) is schema-lenient, so the moment this migration
--   lands, real leads start arriving WITH attribution in those columns. Dropping
--   them later destroys the only record of which campaign produced which deal —
--   and unlike a policy, that data cannot be recreated.
--
--   A structural rollback is safe only on an empty branch. On a database that has
--   taken traffic, this is the correct one.
--
-- What it restores: the bounded anon INSERT policies exactly as
-- 20260624053746_harden_anon_insert_bounded_checks left them — same predicates,
-- minus the UTM clauses this migration added. Anon still cannot SELECT.

do $rb$
begin
  if to_regclass('public.leads') is null then
    raise notice '[lead-utm/rollback] public.leads absent - skipped.';
    return;
  end if;

  drop policy if exists "anon insert leads" on public.leads;
  create policy "anon insert leads"
    on public.leads for insert to anon
    with check (
      phone is not null
      and char_length(phone) between 6 and 40
      and char_length(coalesce(full_name,''))     <= 200
      and char_length(coalesce(customer_type,'')) <= 60
      and char_length(coalesce(model_name,''))    <= 80
      and char_length(coalesce(source,''))        <= 300
    );

  if to_regclass('public.partners') is not null then
    drop policy if exists "anon insert partners" on public.partners;
    create policy "anon insert partners"
      on public.partners for insert to anon
      with check (
        char_length(coalesce(business_name,'')) <= 200
        and char_length(coalesce(contact_name,'')) <= 200
        and char_length(coalesce(phone,''))        <= 40
        and char_length(coalesce(city,''))         <= 120
      );
  end if;

  -- The reporting index is pure derived structure; dropping it loses nothing.
  drop index if exists public.leads_utm_source_idx;

  raise notice '[lead-utm/rollback] policies restored, index dropped, UTM columns KEPT.';
end $rb$;
