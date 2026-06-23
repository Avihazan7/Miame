import { supabase } from "./supabase";

export type EventName =
  | "PageViewed"
  | "ModelSelected"
  | "SimulatorChanged"
  | "LeadSubmitted"
  | "WhatsAppClicked"
  | "PartnerInterest";

export async function track(
  event: EventName,
  payload: Record<string, unknown> = {}
): Promise<void> {
  try {
    if (!supabase) return;
    await supabase.from("events").insert({ event_name: event, payload });
  } catch {
    // tracking never blocks the experience
  }
}
