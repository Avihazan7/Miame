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
