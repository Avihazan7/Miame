-- Defense-in-depth: replace WITH CHECK (true) on the public (anon) INSERT policies
-- with bounded input checks. Shrinks the spam/abuse surface and resolves the
-- rls_policy_always_true advisor. Bounds are generous so no legitimate lead is rejected.

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

drop policy if exists "anon insert partners" on public.partners;
create policy "anon insert partners"
  on public.partners for insert to anon
  with check (
    char_length(coalesce(business_name,'')) <= 200
    and char_length(coalesce(contact_name,'')) <= 200
    and char_length(coalesce(phone,''))        <= 40
    and char_length(coalesce(city,''))         <= 120
  );

drop policy if exists "anon insert events" on public.events;
create policy "anon insert events"
  on public.events for insert to anon
  with check (
    char_length(coalesce(event_name,'')) between 1 and 100
    and (payload is null or char_length(payload::text) <= 8000)
  );