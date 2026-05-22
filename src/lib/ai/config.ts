export type AiProvider = "anthropic" | "openai";

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
}

export function anthropicFromEnv(): AiConfig | null {
  const apiKey = process.env["ANTHROPIC_API_KEY"]?.trim();
  if (!apiKey) {
    return null;
  }
  return {
    provider: "anthropic",
    apiKey,
    model: process.env["ANTHROPIC_MODEL"] ?? "claude-sonnet-4-20250514",
  };
}

export function openaiFromEnv(): AiConfig | null {
  const apiKey = process.env["OPENAI_API_KEY"]?.trim();
  if (!apiKey) {
    return null;
  }
  return {
    provider: "openai",
    apiKey,
    model: process.env["OPENAI_MODEL"] ?? "gpt-4o-mini",
  };
}

export function getAiConfig(): AiConfig | null {
  return resolveAiConfigFromPreference("auto");
}

export function resolveAiConfigFromPreference(
  preference: "auto" | "anthropic" | "openai",
): AiConfig | null {
  if (preference === "openai") {
    return openaiFromEnv() ?? anthropicFromEnv();
  }
  if (preference === "anthropic") {
    return anthropicFromEnv() ?? openaiFromEnv();
  }
  const envPreferred = process.env["AI_PROVIDER"]?.trim() as AiProvider | undefined;
  if (envPreferred === "openai") {
    return openaiFromEnv() ?? anthropicFromEnv();
  }
  if (envPreferred === "anthropic") {
    return anthropicFromEnv() ?? openaiFromEnv();
  }
  return anthropicFromEnv() ?? openaiFromEnv();
}

export function isAiAvailable(): boolean {
  return getAiConfig() !== null;
}
