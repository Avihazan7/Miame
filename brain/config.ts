// brain/config.ts — the U.M.M model ladder + runtime configuration.
//
// Tier doctrine (ULEASE_SPEC §7): Ultra = orchestration/routing · Master = domain
// quality decisions · Max = fast execution. Models are env-configurable; defaults
// are the Sonnet/Haiku tiers. Elevate Ultra to an Opus-class model for complex
// orchestration via BRAIN_MODEL_ULTRA — kept out of source on purpose.
import type { ModelTier } from "./types";

export const MODELS: Record<ModelTier, string> = {
  ultra: process.env.BRAIN_MODEL_ULTRA || "claude-sonnet-4-6",
  master: process.env.BRAIN_MODEL_MASTER || "claude-sonnet-4-6",
  max: process.env.BRAIN_MODEL_MAX || "claude-haiku-4-5-20251001"
};

export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
export const ANTHROPIC_BASE = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";
export const ANTHROPIC_VERSION = "2023-06-01";

/** True only when an API key is present — guards every model call. */
export const brainReady: boolean = Boolean(ANTHROPIC_API_KEY);

export const MAX_OUTPUT_TOKENS = 1024;

// Knowledge layer (RAG). The corpus is public marketing/spec facts (anon-SELECT),
// so the same public Supabase creds as the site are used. Server-side reads only.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://thhyfwoeybkptxvbpcmg.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaHlmd29leWJrcHR4dmJwY21nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDc5OTIsImV4cCI6MjA5NzI4Mzk5Mn0.Yb_FnyXGPEfTlnj6FhoxAZRw0T2pGyT_N4cUM37VsaA";

// Embeddings provider — the RAG *vector* path (cosine over pgvector). Voyage AI's
// voyage-3.x family returns 1024-dim vectors, matching the `embedding vector(1024)`
// column and the `match_knowledge` RPC. Kept separate from ANTHROPIC_API_KEY on
// purpose: Anthropic has no embeddings endpoint. GATED — with no key, retrieval
// degrades to keyword search (accurate at the current corpus size), so the brain
// never hard-fails. Backfill writes need the service-role key (server-only).
export const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY || "";
export const VOYAGE_BASE = process.env.VOYAGE_BASE_URL || "https://api.voyageai.com";
export const EMBED_MODEL = process.env.BRAIN_EMBED_MODEL || "voyage-3.5";
export const EMBED_DIM = 1024;
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/** True only when an embeddings key is present — guards the vector retrieval path. */
export const embeddingsReady: boolean = Boolean(VOYAGE_API_KEY);
