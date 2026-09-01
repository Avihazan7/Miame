// MiaMe owns a dedicated Supabase project for CRM, RAG and vehicle media.
// The central U.Lease database is reached through LEASING_API_URL instead; it is
// never a drop-in replacement for these public tables.
export const MIAME_SUPABASE_PROJECT_REF = "thhyfwoeybkptxvbpcmg";
export const MIAME_SUPABASE_DEFAULT_URL =
  `https://${MIAME_SUPABASE_PROJECT_REF}.supabase.co`;
export const MIAME_SUPABASE_DEFAULT_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaHlmd29leWJrcHR4dmJwY21nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDc5OTIsImV4cCI6MjA5NzI4Mzk5Mn0.Yb_FnyXGPEfTlnj6FhoxAZRw0T2pGyT_N4cUM37VsaA";

type PublicSupabaseEnv = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
};

export type SupabasePublicConfig = {
  url: string;
  anonKey: string;
  source: "environment" | "miame-default";
};

function isMiaMeProjectUrl(value: string): boolean {
  try {
    return new URL(value).hostname === `${MIAME_SUPABASE_PROJECT_REF}.supabase.co`;
  } catch {
    return false;
  }
}

/**
 * Resolve the public URL/key as one atomic credential pair.
 *
 * A partial override must never combine a URL from one project with the default
 * key from another. A complete override is accepted only for MiaMe's governed
 * project; the central U.Lease project has a different schema and tenant role.
 */
export function resolveSupabasePublicConfig(
  env: PublicSupabaseEnv
): SupabasePublicConfig {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (url && anonKey && isMiaMeProjectUrl(url)) {
    return { url, anonKey, source: "environment" };
  }

  return {
    url: MIAME_SUPABASE_DEFAULT_URL,
    anonKey: MIAME_SUPABASE_DEFAULT_ANON_KEY,
    source: "miame-default",
  };
}

// Keep direct property reads so Next.js can inline NEXT_PUBLIC_* values into the
// browser bundle. Passing the whole process.env object would bypass that transform.
export const SUPABASE_PUBLIC_CONFIG = resolveSupabasePublicConfig({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});
