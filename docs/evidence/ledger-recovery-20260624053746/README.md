# 20260624053746_harden_anon_insert_bounded_checks — recovered from the ledger

This migration landed on the MiaMe database outside git. It is now back in the repo.

| | |
|---|---|
| version | `20260624053746` |
| name | `harden_anon_insert_bounded_checks` |
| source | `supabase_migrations.schema_migrations.statements[1]` |
| length | 1,339 characters |
| md5 | `10a6ee346bdfa5983069f93676bff1e6` |
| recovered | 2026-08-31 |

The file in `supabase/migrations/` is byte-identical to the statement the ledger
holds: the same md5, computed by Postgres on its own row and by `md5sum` on the
file. It was transcribed from the ledger, never retyped from memory, and the
ledger row itself was not modified.

## The correction this records

An earlier note in this session said DDL that reached production without a git
file "does not survive" a restore point, and listed this migration as unrecoverable
debt. **That was wrong.** Supabase stores each migration's full SQL in the ledger's
`statements` array, so a migration applied through any Supabase path — CLI, MCP,
dashboard — can be read back verbatim. The recovery is a query, not an archaeology
project:

```sql
select statements[1]
from supabase_migrations.schema_migrations
where version = '20260624053746'
  and name = 'harden_anon_insert_bounded_checks';
```

What remains true: a migration that exists only in the ledger has no review, no
rollback and no test, and nothing in git rebuilds it. That is why it is recovered
here rather than left as a footnote.

## What it does

Replaces `WITH CHECK (true)` on the three anon INSERT policies (`leads`,
`partners`, `events`) with bounded length checks — closing the
`rls_policy_always_true` advisor. Bounds are generous enough that no legitimate
lead is rejected. Verified live on 2026-08-31: all three policies carry exactly
these predicates.

No rollback file: reverting would restore `WITH CHECK (true)` and reopen the
advisor finding. Undoing a hardening is not a rollback, it is a regression.
