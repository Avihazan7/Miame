// test/brainFailover.test.ts — P0 reliability contract for brain/failover.ts.
//
// The production incident: /api/brain returned raw "Anthropic API credit balance
// is too low" failures. The contract asserted here:
//   · primary provider is used when healthy
//   · a retriable primary failure (402/429/5xx/timeout) fails over to the fallback
//   · a non-retriable request bug (400) does NOT fail over
//   · after 3 consecutive failures the circuit opens and the provider is skipped
//   · when everything is down the thrown error is generic — no vendor text leaks
//   · the health snapshot exposes providers + circuit state and no secrets
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
process.env.OPENAI_API_KEY = "test-openai-key";
process.env.AI_PRIMARY_PROVIDER = "anthropic";
process.env.AI_FALLBACK_PROVIDER = "openai";
process.env.BRAIN_TIMEOUT_MS = "500";

const { generateWithFailover, resetCircuits, providerChain, providersHealth, circuitState } =
  await import("../brain/failover");

const CALL = { tier: "max" as const, system: "s", user: "u" };

const anthropicOk = () =>
  new Response(JSON.stringify({ content: [{ type: "text", text: "from-claude" }] }), { status: 200 });
const openaiOk = () =>
  new Response(JSON.stringify({ choices: [{ message: { content: "from-openai" } }] }), { status: 200 });
const vendorError = (status: number, body: string) => new Response(body, { status });

describe("brain failover", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetCircuits();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("provider chain = verified primary then verified fallback", () => {
    expect(providerChain()).toEqual(["anthropic", "openai"]);
  });

  it("healthy primary answers — fallback is never called", async () => {
    fetchMock.mockResolvedValueOnce(anthropicOk());
    expect(await generateWithFailover(CALL)).toBe("from-claude");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("api.anthropic.com");
  });

  it("credit-balance failure (retriable 4xx/5xx) fails over to openai", async () => {
    fetchMock
      .mockResolvedValueOnce(vendorError(529, "Anthropic API credit balance is too low"))
      .mockResolvedValueOnce(openaiOk());
    expect(await generateWithFailover(CALL)).toBe("from-openai");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("api.openai.com");
  });

  it("timeout on primary fails over to fallback", async () => {
    fetchMock
      .mockImplementationOnce((_url, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          (init.signal as AbortSignal).addEventListener("abort", () => {
            const e = new Error("aborted");
            e.name = "AbortError";
            reject(e);
          });
        }),
      )
      .mockResolvedValueOnce(openaiOk());
    expect(await generateWithFailover(CALL)).toBe("from-openai");
  }, 10_000);

  it("a non-retriable 400 request bug does NOT fail over", async () => {
    fetchMock.mockResolvedValueOnce(vendorError(400, "bad request: invalid model"));
    await expect(generateWithFailover(CALL)).rejects.toThrow(/rejected by the AI provider/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("3 consecutive failures open the circuit; the provider is then skipped", async () => {
    for (let i = 0; i < 3; i++) {
      fetchMock
        .mockResolvedValueOnce(vendorError(500, "boom"))
        .mockResolvedValueOnce(openaiOk());
      await generateWithFailover(CALL);
    }
    expect(circuitState("anthropic")).toBe("open");

    // 4th call: anthropic is skipped entirely — only openai is hit.
    fetchMock.mockResolvedValueOnce(openaiOk());
    const before = fetchMock.mock.calls.length;
    expect(await generateWithFailover(CALL)).toBe("from-openai");
    expect(fetchMock.mock.calls.length).toBe(before + 1);
    expect(String(fetchMock.mock.calls[before][0])).toContain("api.openai.com");
  });

  it("all providers down → generic error, vendor text never leaks", async () => {
    fetchMock
      .mockResolvedValueOnce(vendorError(529, "credit balance is too low; account acct_123"))
      .mockResolvedValueOnce(vendorError(500, "openai internal: org-456 quota"));
    const err = await generateWithFailover(CALL).catch((e: Error) => e);
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe("[brain] all AI providers unavailable right now.");
    expect((err as Error).message).not.toMatch(/credit|acct|org-|quota/);
  });

  it("health snapshot: providers + circuit state, no key material", () => {
    const h = providersHealth();
    expect(h.primary).toEqual({ name: "anthropic", configured: true, circuit: expect.any(String) });
    expect(h.fallback).toEqual({ name: "openai", configured: true, circuit: expect.any(String) });
    expect(JSON.stringify(h)).not.toContain("test-anthropic-key");
    expect(JSON.stringify(h)).not.toContain("test-openai-key");
  });
});
