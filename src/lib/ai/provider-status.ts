import type { AiProvider } from "@/lib/ai/config";
import { anthropicFromEnv, openaiFromEnv } from "@/lib/ai/config";

export interface AiProviderInfo {
  id: AiProvider;
  name: string;
  envKey: string;
  modelEnvKey: string;
  configured: boolean;
  model: string | null;
}

const PROVIDER_META: {
  id: AiProvider;
  name: string;
  envKey: string;
  modelEnvKey: string;
}[] = [
  {
    id: "anthropic",
    name: "Claude (Anthropic)",
    envKey: "ANTHROPIC_API_KEY",
    modelEnvKey: "ANTHROPIC_MODEL",
  },
  {
    id: "openai",
    name: "ChatGPT (OpenAI)",
    envKey: "OPENAI_API_KEY",
    modelEnvKey: "OPENAI_MODEL",
  },
];

export function listAiProviderInfo(): AiProviderInfo[] {
  const anthropic = anthropicFromEnv();
  const openai = openaiFromEnv();

  return PROVIDER_META.map((meta) => {
    const config = meta.id === "anthropic" ? anthropic : openai;
    return {
      ...meta,
      configured: config !== null,
      model: config?.model ?? null,
    };
  });
}

export function envAiProviderHint(): string | null {
  const raw = process.env["AI_PROVIDER"]?.trim();
  if (raw === "anthropic" || raw === "openai") {
    return raw;
  }
  return null;
}
