-- MiaMe.co.il · Migration: pin search_path on the two updated_at trigger fns.
--
-- Supabase security advisor lint 0011 (function_search_path_mutable) flags two
-- trigger functions on the shared production database with a role-mutable
-- search_path:
--   • public.seo_touch_updated_at()
--   • public.catalog_touch_updated_at()
--
-- Both are verified (read-only, pg_proc) to be:
--   • trigger functions (return type `trigger`), zero declared arguments;
--   • SECURITY INVOKER (prosecdef = false);
--   • with no search_path currently set (proconfig = null).
-- Their only side effect is setting NEW.updated_at = now() on the row being
-- written, so pinning search_path is fully behaviour-preserving — identical
-- writes, identical timestamps. `now()` and the NEW record resolve regardless of
-- path; pinning only removes the object-shadowing surface the advisor warns about.
--
-- Mirrors the established repo pattern (20260704_harden_match_knowledge_search_path.sql,
-- 20260701_catalog_2026_rls_hardening.sql). Idempotent: ALTER ... SET is safe to
-- run more than once.
--
-- ⚠️ NOT APPLIED to production. This file is a tracked, reviewable artifact only.
-- Apply requires the explicit approval phrase: APPROVE MIAME PRODUCTION MIGRATION.
-- Target project (by env-name resolution): leasing-co-il-prod (the shared U.M.M
-- production DB that NEXT_PUBLIC_SUPABASE_URL points MiaMe at). Risk: none —
-- behaviour-preserving; no data touched; no RLS/policy change; instant catalog op.

alter function public.seo_touch_updated_at()      set search_path = public, pg_temp;
alter function public.catalog_touch_updated_at()  set search_path = public, pg_temp;
