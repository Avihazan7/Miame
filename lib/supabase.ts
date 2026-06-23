import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseReady = Boolean(url && anon);

export const supabase: SupabaseClient | null = supabaseReady
  ? createClient(url as string, anon as string)
  : null;

export interface LeadRecord {
  full_name: string;
  phone: string;
  customer_type: string;
  model_name: string;
  base_price: number;
  down_payment: number;
  balloon: number;
  months: number;
  monthly_payment: number;
  source: string;
}

export interface PartnerRecord {
  business_name: string;
  contact_name: string;
  phone: string;
  city: string;
  planned_assets: number;
}

export async function saveLead(lead: LeadRecord): Promise<boolean> {
  try {
    if (!supabase) return false;
    const { error } = await supabase.from("leads").insert(lead);
    return !error;
  } catch {
    return false;
  }
}

export async function savePartner(partner: PartnerRecord): Promise<boolean> {
  try {
    if (!supabase) return false;
    const { error } = await supabase.from("partners").insert(partner);
    return !error;
  } catch {
    return false;
  }
}
