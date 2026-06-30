"use client";

// components/CatalogExperience.tsx — the adaptive layer over the 2026 catalog.
//
// Wires three live behaviours onto the static grid, all best-effort (never blocks
// the UI when the brain is unreachable):
//   • In-Market — an anonymous visitor ref (localStorage) emits a /signal on each
//     card open; the visitor's In-Market band comes back and drives "Ultra Design"
//     elevation across the grid (calm → intense as intent rises).
//   • Master Match — the brain's best-fit model for THIS visitor is highlighted
//     and surfaced in a banner.
//   • Ultra Design — elevation derived from the band intensifies the cards.
//
// The brain decides (sealed, server-side); this component only reflects.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import VehicleCard from "@/components/VehicleCard";
import {
  type CatalogModel,
  type InMarketBand,
  elevationForBand,
  bandLabel,
  isUltraPremium,
} from "@/lib/catalog";

interface MatchState {
  matchId: string | null;
  matchPct: number | null;
  band: InMarketBand | null;
  action: string | null;
}

/** A stable anonymous visitor ref, persisted per browser. */
function visitorRef(): string {
  try {
    const k = "miame_ref";
    let v = localStorage.getItem(k);
    if (!v) {
      v = "mia-" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(k, v);
    }
    return v;
  } catch {
    return "mia-anon";
  }
}

/** The storefront signal a card view implies (a known brain signal). */
function viewSignal(m: CatalogModel): string {
  const fuel = (m.attributes?.fuelHe ?? m.fuelType ?? "").toString();
  if (/חשמל/.test(fuel)) return "view_ev";
  if (isUltraPremium(m)) return "view_luxury";
  return "view_specs";
}

interface BrandGroup {
  make: string;
  makeHe: string;
  models: CatalogModel[];
}

/** Group models under their manufacturer (יצרן), brands A→ת, models cheapest
 *  first within a brand — the "תחת כל יצרן/מותג" catalog layout. */
function groupByBrand(models: CatalogModel[]): BrandGroup[] {
  const byMake = new Map<string, BrandGroup>();
  for (const m of models) {
    const g = byMake.get(m.make) ?? { make: m.make, makeHe: m.makeHe ?? m.make, models: [] };
    g.models.push(m);
    byMake.set(m.make, g);
  }
  const groups = [...byMake.values()];
  for (const g of groups) {
    g.models.sort((a, b) => (a.fromPrice ?? Infinity) - (b.fromPrice ?? Infinity) || a.name.localeCompare(b.name, "he"));
  }
  return groups.sort((a, b) => a.makeHe.localeCompare(b.makeHe, "he"));
}

export default function CatalogExperience({ models }: { models: CatalogModel[] }) {
  const [state, setState] = useState<MatchState>({ matchId: null, matchPct: null, band: null, action: null });
  const refId = useRef<string>("");

  const refreshMatch = useCallback(async () => {
    try {
      const res = await fetch("/api/catalog-match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ref: refId.current }),
      });
      const data = await res.json();
      setState({
        matchId: data?.match?.id ?? null,
        matchPct: data?.match?.fit ?? null,
        band: data?.inMarket?.band ?? null,
        action: data?.inMarket?.nextBestAction ?? null,
      });
    } catch {
      /* best-effort — keep the calm baseline */
    }
  }, []);

  useEffect(() => {
    refId.current = visitorRef();
    void refreshMatch();
  }, [refreshMatch]);

  const onView = useCallback(
    (m: CatalogModel) => {
      // Fire-and-forget the signal, then refresh the In-Market read + match.
      fetch("/api/signal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ref: refId.current, signal: viewSignal(m) }),
      })
        .then(() => refreshMatch())
        .catch(() => {});
    },
    [refreshMatch],
  );

  const elevation = elevationForBand(state.band);
  const matched = models.find((m) => m.id === state.matchId) ?? null;
  const brands = groupByBrand(models);

  return (
    <div className="flex flex-col gap-5">
      {/* In-Market strip */}
      {state.band && state.band !== "cold" && (
        <div
          className={[
            "flex items-center justify-between gap-3 rounded-xl2 px-4 py-3 text-sm transition",
            elevation >= 2 ? "bg-azure text-white shadow-lift" : "bg-mist text-ink ring-1 ring-line",
          ].join(" ")}
          role="status"
        >
          <span className="font-semibold">סטטוס התאמה: {bandLabel(state.band)}</span>
          {state.action && <span className={elevation >= 2 ? "text-white/90" : "text-slate"}>{state.action}</span>}
        </div>
      )}

      {/* Master Match banner */}
      {matched && (
        <div className="flex items-center gap-4 rounded-xl2 bg-gradient-to-l from-azure/10 to-sky/10 p-4 ring-1 ring-azure/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-azure text-white">★</div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-ink">
              ה־Master Match שלך: {matched.makeHe ?? matched.make} {matched.name}
              {typeof state.matchPct === "number" ? ` · ${Math.round(state.matchPct)}% התאמה` : ""}
            </div>
            <div className="text-xs text-slate">נבחר עבורך על בסיס ההעדפות שלך — דטרמיניסטי, מוסבר, מהמוח המרכזי.</div>
          </div>
        </div>
      )}

      {/* Catalog — grouped under each manufacturer (יצרן). Each card links to the
          standalone model page; opening it also emits the In-Market signal. */}
      {brands.map((g) => (
        <section key={g.make} aria-label={g.makeHe} className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between border-b border-line pb-2">
            <h2 className="text-xl font-extrabold text-ink">{g.makeHe}</h2>
            <span className="text-xs text-slate">{g.models.length} דגמים</span>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {g.models.map((m) => (
              <Link
                key={m.id}
                href={`/catalog-2026/${encodeURIComponent(m.id)}`}
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-azure rounded-xl2"
                aria-label={`${m.makeHe ?? m.make} ${m.name} — לדף הדגם`}
              >
                <VehicleCard
                  model={m}
                  matched={m.id === state.matchId}
                  matchPct={m.id === state.matchId ? state.matchPct ?? undefined : undefined}
                  elevation={elevation}
                  onView={onView}
                />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
