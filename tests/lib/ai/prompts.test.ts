import { afterEach, describe, expect, it } from "vitest";

import { resolveAiConfigFromPreference } from "@/lib/ai/config";
import { buildCategorizationSystemPrompt } from "@/lib/ai/prompts/categorization";
import { buildInsightSystemPrompt } from "@/lib/ai/prompts/insights";

describe("AI prompts and config", () => {
  const envSnapshot = { ...process.env };

  afterEach(() => {
    process.env = { ...envSnapshot };
  });

  it("buildCategorizationSystemPrompt lists categories", () => {
    const prompt = buildCategorizationSystemPrompt(["Jedzenie", "Przychód"]);
    expect(prompt).toContain("Jedzenie");
    expect(prompt).toContain("JSON");
  });

  it("buildInsightSystemPrompt mentions filtered transfers", () => {
    const prompt = buildInsightSystemPrompt({
      transfersFiltered: 3,
      excludedByCategory: 1,
      excludedCategoryNames: ["Oszczędności"],
    });
    expect(prompt).toContain("3");
    expect(prompt).toContain("Oszczędności");
  });

  it("resolveAiConfigFromPreference picks openai when key set", () => {
    process.env["OPENAI_API_KEY"] = "sk-test";
    delete process.env["ANTHROPIC_API_KEY"];
    const config = resolveAiConfigFromPreference("openai");
    expect(config?.provider).toBe("openai");
  });
});
