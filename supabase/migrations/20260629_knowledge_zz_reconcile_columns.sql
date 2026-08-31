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

  raise notice '[knowledge-reconcile] category + updated_at present.';
end
$reconcile$;
