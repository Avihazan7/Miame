-- Reverse of 20260910090000_media_events_anon_bounded_insert.sql.
--
-- Removing the policy and the grant returns vehicle_media_events to "no anonymous
-- INSERT at all". app/api/vehicle-media-events/route.ts must be reverted to the
-- service-role client IN THE SAME OPERATION, or every media event silently fails:
-- with RLS on and no policy, an anon INSERT is refused, and the route treats a failed
-- insert as a 500 rather than as data loss it can report.

-- Dropping the POLICY is what actually revokes the ability: anon holds table-level
-- grants by Supabase default and RLS is enabled, so without a policy the insert is
-- refused regardless of the grant. The revoke below is the mirror of the (no-op)
-- grant in the forward file and is safe either way.
drop policy if exists "anon insert vehicle_media_events" on public.vehicle_media_events;
revoke insert on public.vehicle_media_events from anon;
