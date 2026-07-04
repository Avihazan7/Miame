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

// Campaign attribution columns, added by supabase/migrations/20260704_lead_utm.sql.
// They are optional on the record: if the live table hasn't had the migration
// applied yet, insertLenient() transparently retries with these fields stripped,
// so capturing a lead never depends on the schema being up to date.
export interface UtmFields {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  landing_page?: string;
  referrer?: string;
}

const UTM_COLUMNS: (keyof UtmFields)[] = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "landing_page",
  "referrer"
];

export interface LeadRecord extends UtmFields {
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

export interface PartnerRecord extends UtmFields {
  business_name: string;
  contact_name: string;
  phone: string;
  city: string;
  planned_assets: number;
}

/**
 * Insert with forward/backward schema compatibility: try the full row first; if
 * it fails referencing an unknown UTM column (migration not yet applied on this
 * project), strip the UTM fields and retry so the core lead is never lost.
 */
async function insertLenient<T extends UtmFields>(table: string, row: T): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from(table).insert(row);
  if (!error) return true;

  const missingColumn = UTM_COLUMNS.some((c) => error.message.includes(c));
  if (missingColumn) {
    const base = { ...row };
    for (const c of UTM_COLUMNS) delete (base as Partial<UtmFields>)[c];
    const retry = await supabase.from(table).insert(base);
    if (!retry.error) return true;
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[MiaMe] ${table} insert failed (retry):`, retry.error.message);
    }
    return false;
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(`[MiaMe] ${table} insert failed:`, error.message);
  }
  return false;
}

export async function saveLead(lead: LeadRecord): Promise<boolean> {
  try {
    return await insertLenient("leads", lead);
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[MiaMe] lead insert threw:", e);
    }
    return false;
  }
}

export async function savePartner(partner: PartnerRecord): Promise<boolean> {
  try {
    return await insertLenient("partners", partner);
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[MiaMe] partner insert threw:", e);
    }
    return false;
  }
}
