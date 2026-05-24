import { completeWithAi, type FetchFn } from "@/lib/ai/complete";
import type { AiConfig } from "@/lib/ai/config";
import type { DiscretionaryInsightPayload } from "@/lib/ai/discretionary-insight-types";
import { buildDiscretionaryInsightSystemPrompt } from "@/lib/ai/prompts/discretionary-insight";

export interface GenerateDiscretionaryInsightOptions {
  config: AiConfig;
  payload: DiscretionaryInsightPayload;
  fetchFn?: FetchFn;
}

export async function generateDiscretionaryInsight(
  options: GenerateDiscretionaryInsightOptions,
): Promise<string> {
  const { config, payload, fetchFn } = options;
  const user = `Okres: ${payload.periodLabel}, kontekst: ${payload.context}\nDane:\n${JSON.stringify(payload, null, 2)}`;
  return completeWithAi(
    config,
    {
      system: buildDiscretionaryInsightSystemPrompt(),
      user,
      maxTokens: 1400,
    },
    fetchFn,
  );
}
