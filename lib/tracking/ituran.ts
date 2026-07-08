// Ituran "Tick Track" GPS tracker — ADAPTER SKELETON (v1).
//
// ⚠️ NOT LIVE. There is no Ituran integration yet and this file makes NO network
// calls and returns NO fabricated telemetry. It defines the adapter *contract*
// the fleet will use, plus a safe no-op implementation, so the rest of the app
// can be wired against a stable interface today and the real adapter can drop in
// unchanged once the official Ituran Tick Track API docs + credentials arrive.
//
// Do not present live tracking on the public site while `ituranAdapter.ready`
// is false — the honest state is "planned / pending integration".

export interface AssetLocation {
  assetCode: string;
  lat: number;
  lng: number;
  /** Epoch ms of the fix — injected by the host, never generated here. */
  fixedAt: number;
}

export type AdapterState = "unconfigured" | "pending_docs" | "ready" | "error";

export interface TrackerAdapter {
  /** Stable integration id for logs/metrics. */
  readonly integration: string;
  /** Whether the adapter can serve real telemetry. Gate all UI on this. */
  readonly ready: boolean;
  /** Machine-readable state for dashboards. */
  readonly state: AdapterState;
  /** Human-readable reason when not ready. */
  readonly note: string;
  /** Last known location for an asset, or null when unavailable/unconfigured. */
  getLocation(assetCode: string): Promise<AssetLocation | null>;
  /** Bulk locations for a set of assets (empty when unconfigured). */
  getLocations(assetCodes: string[]): Promise<AssetLocation[]>;
}

/**
 * The only adapter shipped in v1: a truthful no-op. It never invents a position;
 * it reports that the integration is pending official documentation. Swap this
 * for a real `IturanTickTrackAdapter` once the API contract is confirmed.
 */
export const ituranAdapter: TrackerAdapter = Object.freeze({
  integration: "ituran-tick-track",
  ready: false,
  state: "pending_docs",
  note:
    "Ituran Tick Track integration is adapter-ready but not live — awaiting official API docs and credentials. No live telemetry is served until then.",
  async getLocation(): Promise<AssetLocation | null> {
    return null;
  },
  async getLocations(): Promise<AssetLocation[]> {
    return [];
  },
});
