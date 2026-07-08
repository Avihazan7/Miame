// MiaMe Rental Fleet OS · v1 — the Eilat / Green Extreme fleet as pure data.
//
// v1 scope: 15 MIA FOUR assets stationed at the Green Extreme / Terminal Park
// hub in Eilat. This module is pure and deterministic (no I/O, no clock) so the
// public site and any future admin dashboard read the SAME source of truth.
//
// Honesty rule (task pack): live per-asset availability is NOT claimed on the
// public site until the tracker integration is real (see lib/tracking/ituran.ts).
// `status` here is operational seed data for the fleet roster, not a live feed.

export type RentalAssetStatus = "available" | "reserved" | "maintenance";

export interface RentalAsset {
  /** Stable asset code, e.g. "MIA-EIL-01". */
  code: string;
  /** Catalogue model id (see lib/models.ts): "4x2" | "2x4lr" | "4x4". */
  modelId: string;
  /** Pricing/operations zone. v1 is Eilat-only. */
  zone: "eilat";
  /** Physical hub the asset lives at. */
  hub: string;
  status: RentalAssetStatus;
}

export const RENTAL_HUB = "Green Extreme · פארק הטרמינל, אילת";

/** Fleet size for v1 — 15 assets in Eilat. */
export const FLEET_SIZE = 15;

// A realistic starting mix across the three models. Codes are stable so the
// admin dashboard and tracker adapter can key on them later.
const MODEL_ROTATION = ["4x2", "2x4lr", "4x4"] as const;
const RESERVED_CODES = new Set(["MIA-EIL-04", "MIA-EIL-09"]);
const MAINTENANCE_CODES = new Set(["MIA-EIL-13"]);

export const RENTAL_FLEET: readonly RentalAsset[] = Object.freeze(
  Array.from({ length: FLEET_SIZE }, (_, i) => {
    const code = `MIA-EIL-${String(i + 1).padStart(2, "0")}`;
    const status: RentalAssetStatus = MAINTENANCE_CODES.has(code)
      ? "maintenance"
      : RESERVED_CODES.has(code)
        ? "reserved"
        : "available";
    return Object.freeze<RentalAsset>({
      code,
      modelId: MODEL_ROTATION[i % MODEL_ROTATION.length],
      zone: "eilat",
      hub: RENTAL_HUB,
      status,
    });
  }),
);

/** Assets currently in "available" state (operational roster, not a live feed). */
export function availableAssets(fleet: readonly RentalAsset[] = RENTAL_FLEET): RentalAsset[] {
  return fleet.filter((a) => a.status === "available");
}

/** Count of assets by model id — for the admin roster / capacity planning. */
export function fleetByModel(
  fleet: readonly RentalAsset[] = RENTAL_FLEET,
): Record<string, number> {
  return fleet.reduce<Record<string, number>>((acc, a) => {
    acc[a.modelId] = (acc[a.modelId] ?? 0) + 1;
    return acc;
  }, {});
}
