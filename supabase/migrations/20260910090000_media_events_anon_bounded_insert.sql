-- vehicle_media_events: an anonymous write stops needing the key that bypasses RLS.
--
-- WHAT WAS WRONG. app/api/vehicle-media-events/route.ts inserted with
-- SUPABASE_SERVICE_ROLE_KEY — the one principal in the project that bypasses RLS —
-- on behalf of an unauthenticated caller, because 20260629_vehicle_media_ultra.sql
-- deliberately created no anonymous INSERT policy and said so:
--   "inserted ... using the service-role key (which bypasses RLS), so there is
--    intentionally NO anonymous INSERT policy".
-- That was a coherent design, but it put the strongest credential in the project on
-- the far side of a public endpoint, where the ONLY things standing between the
-- internet and an RLS-free write were an Origin check that passes when no Origin
-- header is sent (curl, by definition) and an in-memory rate limit.
--
-- MEASURED 2026-09-10 against a production build: 200 unauthenticated POSTs with a
-- rotating x-forwarded-for → 200 accepted, 0 refused. The rate-limit key was
-- attacker-chosen; fixing that (lib/apiGuard.ts) brought it back to the declared
-- 60/min ceiling, but the WRITE was still service-role.
--
-- WHAT THIS DOES. Grants anon exactly the one verb it needs, with the bounds the
-- route's own zod schema already enforces, so the database refuses what the
-- application refuses instead of trusting it to. The route then drops to the anon
-- key — the same move app/api/vehicles/[vehicleId]/media/route.ts already made for
-- reads, whose comment states the principle: "The anon client is not a downgrade
-- here; it is the correct principal."
--
-- DEFENCE IN DEPTH, NOT A SECOND SOURCE OF TRUTH. The bounds below mirror the zod
-- schema; if they ever disagree, the stricter one wins and the caller sees a refusal
-- either way. `event_type` is pinned to the four values the enum allows, because an
-- unbounded text column written by anyone is how a analytics table becomes a
-- free-text store nobody can query.
--
-- NOT PERMITTED: select, update, delete. And the precise reason matters, because the
-- obvious phrasing is wrong. MEASURED on the live table 2026-09-10: anon ALREADY holds
-- table-level INSERT, SELECT, UPDATE and DELETE grants — Supabase's default
-- `grant all ... to anon` — and `relrowsecurity` is true. Under RLS a grant permits
-- nothing on its own; a POLICY does. So what refuses an anon read here is the absence
-- of a SELECT policy, not the absence of a grant, and revoking grants is not what
-- protects this table. The `grant insert` below is therefore a no-op today, kept as an
-- explicit statement of intent that survives any future tightening of the defaults.
-- anon writes, and can never read back.
-- The existing service_role SELECT policy is untouched.
--
-- VERIFIED 2026-09-14 on a throwaway PostgreSQL 16.13 cluster built to carry this
-- table, this policy and Supabase's default `grant select ... to anon`. The policy
-- accepts exactly what the route sends and refuses what it must:
--   insert, all four event types, no RETURNING  -> INSERT 0 4
--   anon reading the table back                 -> 0 rows
--   payload over 8,000 bytes                    -> refused
--   session_id over 64 chars                    -> refused
--   empty vehicle_id                            -> refused
--   source other than 'web'                     -> refused
--
-- AND THE TRAP THAT HID ALL OF THAT. The first live probe of this policy was refused
-- with `new row violates row-level security policy for table "vehicle_media_events"`,
-- which reads like a broken policy and is not. The probe ended in `returning id, ...`,
-- and under RLS a RETURNING clause requires the new row to be visible through a SELECT
-- policy — which anon must never have here. Dropping RETURNING, the identical row
-- inserts. Both halves were reproduced byte for byte on the local cluster above.
-- The route does not use RETURNING: postgrest-js sets `Prefer: return=representation`
-- only from `.select()`, which the route does not call, and a test now holds it there.
-- Anyone probing this policy by hand must drop the RETURNING clause or be misled.

grant insert on public.vehicle_media_events to anon;

drop policy if exists "anon insert vehicle_media_events" on public.vehicle_media_events;
create policy "anon insert vehicle_media_events"
  on public.vehicle_media_events for insert to anon
  with check (
    char_length(coalesce(vehicle_id,'')) between 1 and 140
    and event_type in ('gallery_view', 'spin360_view', 'model3d_view', 'cta_click')
    and source = 'web'
    and char_length(coalesce(session_id,'')) <= 64
    -- 8,000 matches the route's body cap; the flat-scalar shape is enforced by zod,
    -- and this is the ceiling that holds even if the route is bypassed entirely.
    and (payload is null or char_length(payload::text) <= 8000)
  );
