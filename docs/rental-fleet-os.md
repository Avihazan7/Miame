# MiaMe Rental Fleet OS — v1 (Eilat / Green Extreme)

Scope document for the rental layer. **v1 ships the public rental funnel; the
admin dashboard and live tracking are scoped here but not built.**

## What v1 ships (this PR)

- **Rental section** on the home page (`components/RentalFleet.tsx`, rendered
  after the simulator) — fleet size, "from ₪50/hour", WhatsApp booking + Waze.
- **Rental lead flow** — WhatsApp-first, with best-effort persistence via
  `saveRentalLead()`. It never blocks the funnel and never touches the existing
  product `saveLead` flow.
- **Fleet roster** — `lib/rental-fleet.ts`: **15 assets in Eilat** at the Green
  Extreme / Terminal Park hub, as pure, frozen data (single source of truth).
- **Tracker adapter skeleton** — `lib/tracking/ituran.ts`: the `TrackerAdapter`
  contract + an honest no-op `ituranAdapter` (`ready: false`,
  `state: "pending_docs"`). No network calls, no fabricated telemetry.
- **Waze navigation** — `wazeUrl()` deep link to Green Extreme.
- **Schema proposal** — `docs/rental-fleet-schema-proposal.sql` (NOT applied).

## Explicit non-goals for v1

- No live GPS tracking. "Real-time availability" is shown as **coming soon** and
  availability is confirmed with the team — until Ituran Tick Track is live.
- No Supabase migration is applied. No change to product finance, the existing
  Supabase lead flow, the WhatsApp product flow, or product pricing.

## Ituran Tick Track integration plan

`lib/tracking/ituran.ts` defines the adapter the app codes against today:

```
TrackerAdapter { integration, ready, state, note, getLocation(), getLocations() }
```

Rollout when official docs + credentials arrive:
1. Implement `IturanTickTrackAdapter` behind the same interface (server-side only;
   credentials in server env, never `NEXT_PUBLIC`).
2. Flip the exported adapter from the no-op to the real one.
3. Gate any live-location UI on `adapter.ready === true`.
4. Backfill `rental_assets.tracker_asset_id` per asset code.

Until then, `ready` stays `false` and no live data is presented — no fake API
promises.

## Admin Fleet Dashboard — scope (not built in v1)

A future authenticated `/admin/fleet` surface (service-role only):

- **Roster view** — all `rental_assets` with model, hub, status; inline status
  edit (available / reserved / maintenance).
- **Live map** — per-asset location once `ituranAdapter.ready`; hidden while
  pending. Reads `getLocations(codes)`.
- **Rental inbox** — `rental_leads` inquiries (name, phone, requested hours,
  source/UTM) with WhatsApp reply + a "converted" flag.
- **Capacity** — available vs total, utilisation, per-model counts
  (`fleetByModel()`).
- **Auth** — Supabase service role behind an admin gate; the anon key must never
  read `rental_assets`. RLS in the schema proposal already blocks anon reads.

Data contracts already exist (`RentalAsset`, `RentalLeadRecord`,
`TrackerAdapter`), so the dashboard is additive when approved.

## Rollout checklist

- [x] Public rental section + funnel (WhatsApp + Waze)
- [x] 15-asset Eilat roster (pure data)
- [x] Tracker adapter skeleton (honest, no-op)
- [x] Schema proposal (docs only, not applied)
- [ ] Business sign-off on rental terms/pricing copy
- [ ] Apply `rental_leads` + `rental_assets` migration
- [ ] Implement real Ituran adapter once docs arrive
- [ ] Build `/admin/fleet` dashboard
