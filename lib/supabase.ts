import { createClient, SupabaseClient } from "@supabase/supabase-js";

// The Supabase URL + anon (publishable) key are PUBLIC by design — they ship in
// every client bundle. Hardcoding them as defaults makes the CRM work out-of-the-box
// with no Vercel env setup; data is protected by RLS (anon may INSERT only, never read).
// Override per-environment via NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://thhyfwoeybkptxvbpcmg.supabase.co";
const anon =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaHlmd29leWJrcHR4dmJwY21nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDc5OTIsImV4cCI6MjA5NzI4Mzk5Mn0.Yb_FnyXGPEfTlnj6FhoxAZRw0T2pGyT_N4cUM37VsaA";

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
    if (error && process.env.NODE_ENV !== "production") {
      console.warn("[MiaMe] lead insert failed:", error.message);
    }
    return !error;
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[MiaMe] lead insert threw:", e);
    }
    return false;
  }
}

export async function savePartner(partner: PartnerRecord): Promise<boolean> {
  try {
    if (!supabase) return false;
    const { error } = await supabase.from("partners").insert(partner);
    if (error && process.env.NODE_ENV !== "production") {
      console.warn("[MiaMe] partner insert failed:", error.message);
    }
    return !error;
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[MiaMe] partner insert threw:", e);
    }
    return false;
  }
}
