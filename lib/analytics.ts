import { getUtm } from "./utm";
import { adsConversion, ADS_LEAD_LABEL, ADS_WHATSAPP_LABEL, ga4Event, metaEvent } from "./marketing";

export type EventName =
  | "PageViewed"
  | "ModelSelected"
  | "SimulatorChanged"
  | "LeadSubmitted"
  | "WhatsAppClicked"
  | "PartnerInterest"
  | "DealBuzzClicked"
  | "RentalInterest"
  | "CinematicVideoPlay"
  | "CinematicVideoCTA"
  | "FreedomMomentPlay"
  | "EntryPathSelect"
  | "HowToVideoPlay"
  | "HeroPrimaryCTA"
  | "HeroSecondaryCTA"
  | "HeroScrollCue";

/**
 * One event, three sinks: the Supabase `events` table (owned analytics), GA4,
 * and the ad platforms (Google Ads conversions + Meta Pixel). Every event is
 * enriched with the persisted UTM attribution so campaigns are measurable
 * end-to-end. All sinks are best-effort — tracking never blocks the funnel.
 */
export async function track(
  event: EventName,
  payload: Record<string, unknown> = {}
): Promise<void> {
  const enriched = { ...getUtm(), ...payload };

  forwardToPixels(event, enriched);

  try {
    // DYNAMIC, and this is the whole point. MEASURED 2026-09-09 on a fresh build:
    // a static `import { supabase } from "./supabase"` here put the entire
    // @supabase/supabase-js SDK — 238KB raw / 61.5KB gz, as chunks 445 and
    // 44530001 — into the INITIAL script set of / and of all four SEO landing
    // pages, because `track` is statically imported by 13 client components
    // including the LCP component (Hero) and the sticky header. The page never
    // uses it: what shipped was a realtime websocket client, a PKCE auth client,
    // a storage client and a Buffer shim, parsed and executed during hydration on
    // a site that has no login. `createClient()` also ran at module scope, so
    // every load booted GoTrue with persistSession/detectSessionInUrl/
    // autoRefreshToken all true — reading localStorage, parsing the URL for an
    // auth fragment and arming a refresh timer, inside the hydration window,
    // competing with the LCP image preload.
    //
    // `track` was already async, so nothing above this line changes. Webpack now
    // splits those chunks out of the initial graph and fetches them on the first
    // tracked interaction. Guarded by test/bundleBudget.test.ts.
    const { supabase } = await import("./supabase");
    if (!supabase) return;
    await supabase.from("events").insert({ event_name: event, payload: enriched });
  } catch {
    // tracking never blocks the experience
  }
}

/** Map internal funnel events onto GA4 / Google Ads / Meta Pixel conventions. */
function forwardToPixels(event: EventName, params: Record<string, unknown>): void {
  switch (event) {
    case "ModelSelected":
      ga4Event("select_item", params);
      metaEvent("ViewContent", params);
      break;
    case "SimulatorChanged":
      ga4Event("configure_deal", params);
      break;
    case "LeadSubmitted":
      ga4Event("generate_lead", params);
      adsConversion(ADS_LEAD_LABEL, params);
      metaEvent("Lead", params);
      break;
    case "WhatsAppClicked":
      ga4Event("whatsapp_click", params);
      adsConversion(ADS_WHATSAPP_LABEL, params);
      metaEvent("Contact", params);
      break;
    case "PartnerInterest":
      ga4Event("generate_lead", { ...params, lead_type: "b2b" });
      metaEvent("Lead", { ...params, lead_type: "b2b" });
      break;
    case "DealBuzzClicked":
      // Engagement, not a conversion — GA4's promotion-interaction event + a Meta
      // custom event. No Google Ads conversion is fired for a deal-buzz click.
      ga4Event("select_promotion", params);
      metaEvent("DealBuzzClick", params, false);
      break;
    // PageViewed is covered by GA4 config + Pixel PageView on load.
    default:
      break;
  }
}
