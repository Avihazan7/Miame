import { describe, expect, it } from "vitest";
import {
  MIAME_SUPABASE_DEFAULT_ANON_KEY,
  MIAME_SUPABASE_DEFAULT_URL,
  resolveSupabasePublicConfig,
} from "@/lib/supabase-config";

describe("MiaMe public Supabase credential pair", () => {
  const fallback = {
    url: MIAME_SUPABASE_DEFAULT_URL,
    anonKey: MIAME_SUPABASE_DEFAULT_ANON_KEY,
    source: "miame-default",
  };

  it("uses the governed defaults when no overrides exist", () => {
    expect(resolveSupabasePublicConfig({})).toEqual(fallback);
  });

  it("never combines a one-sided URL override with the default key", () => {
    expect(
      resolveSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: "https://xfihhcojfiajbxozanwi.supabase.co",
      })
    ).toEqual(fallback);
  });

  it("never combines a one-sided key override with the default URL", () => {
    expect(
      resolveSupabasePublicConfig({ NEXT_PUBLIC_SUPABASE_ANON_KEY: "one-sided-key" })
    ).toEqual(fallback);
  });

  it("rejects even a complete pair aimed at the central U.Lease project", () => {
    expect(
      resolveSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: "https://xfihhcojfiajbxozanwi.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "central-key",
      })
    ).toEqual(fallback);
  });

  it("accepts a complete MiaMe pair and trims dashboard whitespace", () => {
    expect(
      resolveSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: `  ${MIAME_SUPABASE_DEFAULT_URL}/  `,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "  sb_publishable_rotated  ",
      })
    ).toEqual({
      url: `${MIAME_SUPABASE_DEFAULT_URL}/`,
      anonKey: "sb_publishable_rotated",
      source: "environment",
    });
  });
});
