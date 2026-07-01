-- Catalog 2026 — RLS & search_path hardening
-- =============================================================================
-- Closes the Supabase security advisories on the 2026 catalog schema:
--   • rls_enabled_no_policy  ×6  (INFO / SECURITY)
--   • function_search_path_mutable ×1 (WARN / SECURITY)
--
-- CONTEXT — schema drift
-- The 2026 catalog tables (vehicle_master_2026, suppliers_2026, leads_2026,
-- deals_2026, …) were created directly against `leasing-co-il-prod` by the
-- catalog-sync process and are not yet captured as repo migrations. This file
-- reconciles only the security posture; a full schema-capture is a separate task.
--
-- ACCESS MODEL (matches the sibling _2026 convention)
-- Public, anon-readable catalog data is served ONLY through the already-policied
-- read models — `vehicle_page_projection_2026`, `vehicle_master_2026`,
-- `vehicle_specs_2026`, `vehicle_brands_2026`, `vehicle_media_assets_2026`,
-- `suppliers_2026`, `supplier_offers_2026` (each: SELECT to public, gated on
-- tenant_id + a publishable status).
--
-- The six tables below are internal write-side / ops data and must NEVER be
-- anon-readable:
--   leads_2026                   — PII (contact name / phone / email)
--   deals_2026                   — money + commission plans
--   catalog_audit_log_2026       — before/after mutation trail
--   vehicle_inventory_units_2026 — VIN / chassis / license plate
--   zero_km_disclosures_2026     — license plate + registration facts
--   catalog_health_snapshots_2026— internal ops metrics
--
-- With RLS enabled and no policy, anon/authenticated are already denied and only
-- the service role (BYPASSRLS, used by the backend/catalog-sync) can reach them —
-- so this migration changes NO effective access. It makes that intent explicit
-- (an auditable service-role policy per table) and clears the advisory. The
-- MiaMe web client never touches these tables (it uses the anon key on a
-- separate project and writes to `leads` / `partners` only), so nothing breaks.
-- =============================================================================

-- 1) Explicit service-role-only policies (idempotent) -------------------------
do $$
declare
    t text;
    tables text[] := array[
        'leads_2026',
        'deals_2026',
        'catalog_audit_log_2026',
        'vehicle_inventory_units_2026',
        'zero_km_disclosures_2026',
        'catalog_health_snapshots_2026'
    ];
begin
    foreach t in array tables loop
        execute format('alter table public.%I enable row level security;', t);
        execute format('drop policy if exists %I on public.%I;', t || '_service_all', t);
        execute format(
            'create policy %I on public.%I for all to service_role using (true) with check (true);',
            t || '_service_all', t
        );
    end loop;
end;
$$;

-- 2) Pin the zero-km enforcement trigger's search_path ------------------------
--    Prevents search_path hijacking of the unqualified object references inside
--    the function body (advisor 0011_function_search_path_mutable).
alter function public.enforce_zero_km_disclosure_2026() set search_path = public, pg_temp;
