-- 20260629_knowledge_zz_reconcile_columns.sql
-- MiaMe.co.il · reconcile public.knowledge between git and production.
--
-- MEASURED DRIFT (live project thhyfwoeybkptxvbpcmg, 2026-08-31):
--
--   production columns : id · source · category · body · embedding · created_at
--   repo CREATE TABLE  : id · source ·            body · embedding · created_at · updated_at
--
--   The two diverged in BOTH directions:
--     · `category` exists in production but NO migration in this repo creates it —
--       it was added out of band. And 20260714_knowledge_full_seed_from_crimson_lever.sql
--       INSERTS into it, so on an empty database that seed aborts with
--       `column "category" of relation "knowledge" does not exist`. Its DO-block
--       guard checks that the TABLE exists and never checks the column, so the
--       failure is reported as a successful run right up until the INSERT fires.
--     · `updated_at` is declared by the repo's CREATE TABLE but is absent in
--       production, so anything that writes it would fail there.
--
-- This migration makes both true everywhere. It is additive and idempotent, so it
-- is a no-op on production (which already has `category`) and the fix that lets a
-- fresh database replay the whole directory.
--
-- The "_zz_" infix pins it AFTER 20260629_knowledge_seed_miame.sql (which creates
-- the table) and BEFORE 20260714_… (which needs the column). Filename order is
-- apply order — see scripts/check-migrations.mjs.
--
-- ROLLBACK: 20260629_knowledge_zz_reconcile_columns.rollback.sql

do $reconcile$
begin
  if to_regclass('public.knowledge') is null then
    raise notice '[knowledge-reconcile] public.knowledge absent — skipped.';
    return;
  end if;

  -- Present in production, missing from every repo migration.
  alter table public.knowledge add column if not exists category text;

  -- Declared by the repo, missing in production.
  alter table public.knowledge add column if not exists updated_at timestamptz not null default now();

  -- ── POLICY CONVERGENCE ────────────────────────────────────────────────────
  -- The same drift, in the other half of the schema. 20260629_knowledge_seed_miame
  -- creates two policies that production does not have:
  --
  --   · "public can read knowledge"  — no explicit TO, so it grants to PUBLIC:
  --     every role including authenticated, not just anon.
  --   · "service can manage knowledge" — gated on auth.role(), which Supabase
  --     documents as deprecated for RLS.
  --
  -- Production carries exactly ONE policy: `anon read knowledge`,
  -- FOR SELECT TO anon USING (true). Measured live 2026-08-31.
  --
  -- So the security advisor is green because of the LIVE state, while a replay
  -- from an empty database rebuilds the older, broader, deprecated contract. This
  -- block makes the replay converge on what production actually runs.
  --
  -- No service policy is recreated: service_role carries BYPASSRLS, so a policy
  -- for it is decoration that widens the surface without granting anything new.
  drop policy if exists "public can read knowledge"  on public.knowledge;
  drop policy if exists "service can manage knowledge" on public.knowledge;
  drop policy if exists "anon read knowledge"        on public.knowledge;
  create policy "anon read knowledge"
    on public.knowledge for select to anon
    using (true);

  raise notice '[knowledge-reconcile] category + updated_at present; one anon read policy.';
end
$reconcile$;
