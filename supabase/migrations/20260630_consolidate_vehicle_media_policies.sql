-- Consolidate the vehicle_media_assets RLS policies (Supabase advisor: clears
-- `multiple_permissive_policies` on SELECT and `auth_rls_initplan`).
--
-- Before: two permissive policies overlapped on SELECT —
--   "public can read published vehicle media"  (SELECT,  status='published')
--   "service can manage vehicle media"          (ALL,     auth.role()='service_role')
-- so every SELECT evaluated both policies, and auth.role() was re-evaluated per row.
--
-- After: exactly one policy per command (no SELECT overlap), with auth.role()
-- wrapped in a scalar subselect so it is evaluated once per query (InitPlan).
-- Behavior is IDENTICAL:
--   SELECT : status='published' OR service_role
--   INSERT : service_role
--   UPDATE : service_role (USING + WITH CHECK)
--   DELETE : service_role
--
-- The previous FOR ALL "service can manage" policy is split per-command on
-- purpose: merging it into a single FOR ALL with the public-read OR-clause would
-- expose DELETE (which has no WITH CHECK, only USING) on published rows to
-- non-service roles. Idempotent: DROP POLICY IF EXISTS before CREATE.

drop policy if exists "public can read published vehicle media" on public.vehicle_media_assets;
drop policy if exists "service can manage vehicle media" on public.vehicle_media_assets;
drop policy if exists "vehicle media select" on public.vehicle_media_assets;
drop policy if exists "vehicle media service insert" on public.vehicle_media_assets;
drop policy if exists "vehicle media service update" on public.vehicle_media_assets;
drop policy if exists "vehicle media service delete" on public.vehicle_media_assets;

create policy "vehicle media select"
on public.vehicle_media_assets
as permissive for select to public
using ((status = 'published') or ((select auth.role()) = 'service_role'));

create policy "vehicle media service insert"
on public.vehicle_media_assets
as permissive for insert to public
with check ((select auth.role()) = 'service_role');

create policy "vehicle media service update"
on public.vehicle_media_assets
as permissive for update to public
using ((select auth.role()) = 'service_role')
with check ((select auth.role()) = 'service_role');

create policy "vehicle media service delete"
on public.vehicle_media_assets
as permissive for delete to public
using ((select auth.role()) = 'service_role');
