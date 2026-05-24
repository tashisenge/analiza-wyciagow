import { describe, expect, it, vi, afterEach } from "vitest";

import { envAiProviderHint, listAiProviderInfo } from "@/lib/ai/provider-status";

describe("provider-status", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("lists providers with configured flag", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    const providers = listAiProviderInfo();
    const anthropic = providers.find((item) => item.id === "anthropic");
    const openai = providers.find((item) => item.id === "openai");
    expect(anthropic?.configured).toBe(true);
    expect(openai?.configured).toBe(false);
  });

  it("reads AI_PROVIDER hint", () => {
    vi.stubEnv("AI_PROVIDER", "openai");
    expect(envAiProviderHint()).toBe("openai");
  });
});
