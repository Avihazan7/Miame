-- 20260902_partners_drop_orphan_table.sql
-- MiaMe · drop public.partners — the table of a product that no longer exists.
--
-- WHY — MEASURED ON PRODUCTION, 2026-09-02:
--     rows ......................... 0
--     foreign keys referencing it .. 0
--     readers/writers in the code .. 0
--
--   `partners` was created by the baseline CRM migration for the MiaMe Hub
--   partnership. On 2026-09-02 the owner settled that MiaMe markets and sells MIA
--   FOUR and nothing else — no rental, no business partners. PR #162 removed the
--   /partners page, five components, the FAQ entry, the corpus rows and, in the
--   same sweep, `savePartner()` and the `insertLenient("partners", …)` call. The
--   table has had no writer since, and it never had a reader.
--
-- WHY IT IS NOT MERELY UNTIDY. `anon` holds SELECT, INSERT, UPDATE, DELETE and
--   TRUNCATE grants on it. Nothing is exposed today, because RLS is on and the one
--   policy is INSERT-only, so every other verb is denied by default-deny. But that
--   is a table reachable by an anonymous key, kept alive for a product that was
--   withdrawn — the shape of a surface nobody re-reviews. Dropping it removes the
--   grants, the policy and the reachability together.
--
-- THE DROP IS GUARDED, AND THE GUARD IS THE POINT
--   scripts/migrations-check.mjs M-06 forbids `drop table` in a forward migration,
--   and that rule is correct. This file is the first exemption, and the exemption is
--   NARROWER than a bare allowlist: the gate accepts a drop only from a file that
--   also proves the table is empty and unreferenced before dropping it. So the
--   decision is recorded by name, and the mechanism cannot take data with it even
--   if a row appears between review and apply.
--
-- ROLLBACK: 20260902_partners_drop_orphan_table.rollback.sql
--   It recreates the table from the LIVE definition captured before this ran —
--   17 columns, the primary key, partners_created_idx, RLS, the `anon insert
--   partners` policy with its exact bounded CHECK, and the four role grants. It
--   restores the SHAPE. It cannot restore rows, and there were none to restore.

do $partners_drop$
declare
  n bigint;
  refs int;
begin
  if to_regclass('public.partners') is null then
    raise notice '[partners-drop] public.partners absent - already dropped, skipped.';
    return;
  end if;

  -- PRECONDITION 1 — never drop data. Measured 0 at authoring time; re-measured
  -- here because the window between review and apply is exactly where a row would
  -- arrive, and a migration that discovers this AFTER the drop discovers nothing.
  select count(*) into n from public.partners;
  if n <> 0 then
    raise exception '[partners-drop] refusing: public.partners holds % row(s). It was empty when this was written; export them and decide deliberately.', n;
  end if;

  -- PRECONDITION 2 — nothing may depend on it. A foreign key here would make the
  -- drop cascade or fail; either way it means the table is not the orphan this
  -- migration is about.
  select count(*) into refs from pg_constraint where confrelid = 'public.partners'::regclass;
  if refs <> 0 then
    raise exception '[partners-drop] refusing: % foreign key(s) reference public.partners.', refs;
  end if;

  drop table public.partners;

  -- POSTCONDITION — assert the intent actually landed rather than trusting that it
  -- did. A migration that reports success without checking is how a ledger row and
  -- production disagree.
  if to_regclass('public.partners') is not null then
    raise exception '[partners-drop] postcondition failed: public.partners still exists.';
  end if;

  raise notice '[partners-drop] public.partners dropped (0 rows, 0 references).';
end
$partners_drop$;
