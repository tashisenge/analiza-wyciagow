import { getAiConfig, isAiAvailable } from "@/lib/ai/config";

export function getAiStatus(): { available: boolean; provider: string | null } {
  const config = getAiConfig();
  return {
    available: isAiAvailable(),
    provider: config?.provider ?? null,
  };
}
