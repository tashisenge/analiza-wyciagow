import { getAiConfig } from "@/lib/ai/config";

export interface TavilyConfig {
  apiKey: string;
}

export function getTavilyConfig(): TavilyConfig | null {
  const apiKey = process.env["TAVILY_API_KEY"]?.trim();
  if (!apiKey) {
    return null;
  }
  return { apiKey };
}

export function isResearchAvailable(): boolean {
  return getTavilyConfig() !== null && getAiConfig() !== null;
}
