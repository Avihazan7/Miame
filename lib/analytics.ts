import { supabase } from "./supabase";
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
  | "CinematicVideoCTA";

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
