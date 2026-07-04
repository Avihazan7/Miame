-- MiaMe.co.il · Migration: campaign attribution (UTM) on leads + partners.
--
-- First-touch attribution captured on the client (lib/utm.ts) is stored on every
-- lead/partner so the CRM can measure which campaign produced each deal. The
-- client insert (lib/supabase.ts) is schema-lenient: if this migration hasn't
-- run yet it retries without these columns, so lead capture is never blocked.
-- Applying this migration simply upgrades those inserts to first-class columns.

alter table public.leads
  add column if not exists utm_source   text,
  add column if not exists utm_medium   text,
  add column if not exists utm_campaign text,
  add column if not exists utm_term     text,
  add column if not exists utm_content  text,
  add column if not exists gclid        text,
  add column if not exists fbclid       text,
  add column if not exists landing_page text,
  add column if not exists referrer     text;

alter table public.partners
  add column if not exists utm_source   text,
  add column if not exists utm_medium   text,
  add column if not exists utm_campaign text,
  add column if not exists utm_term     text,
  add column if not exists utm_content  text,
  add column if not exists gclid        text,
  add column if not exists fbclid       text,
  add column if not exists landing_page text,
  add column if not exists referrer     text;

-- Re-assert the anon INSERT policies with bounded UTM (defense-in-depth: the
-- client already caps each field at 200 chars). anon still cannot SELECT.
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
    and char_length(coalesce(utm_source,''))    <= 200
    and char_length(coalesce(utm_medium,''))    <= 200
    and char_length(coalesce(utm_campaign,''))  <= 200
    and char_length(coalesce(utm_term,''))      <= 200
    and char_length(coalesce(utm_content,''))   <= 200
    and char_length(coalesce(gclid,''))         <= 200
    and char_length(coalesce(fbclid,''))        <= 200
    and char_length(coalesce(landing_page,''))  <= 300
    and char_length(coalesce(referrer,''))      <= 300
  );

drop policy if exists "anon insert partners" on public.partners;
create policy "anon insert partners"
  on public.partners for insert to anon
  with check (
    char_length(coalesce(business_name,'')) <= 200
    and char_length(coalesce(contact_name,'')) <= 200
    and char_length(coalesce(phone,''))        <= 40
    and char_length(coalesce(city,''))         <= 120
    and char_length(coalesce(utm_source,''))   <= 200
    and char_length(coalesce(utm_medium,''))   <= 200
    and char_length(coalesce(utm_campaign,'')) <= 200
    and char_length(coalesce(utm_term,''))     <= 200
    and char_length(coalesce(utm_content,''))  <= 200
    and char_length(coalesce(gclid,''))        <= 200
    and char_length(coalesce(fbclid,''))       <= 200
    and char_length(coalesce(landing_page,'')) <= 300
    and char_length(coalesce(referrer,''))     <= 300
  );

-- Attribution reporting index.
create index if not exists leads_utm_source_idx on public.leads (utm_source, created_at desc);
