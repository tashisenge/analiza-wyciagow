import { buildDiscretionaryInsightPayload } from "@/lib/ai/build-discretionary-insight-payload";
import type { AiConfig } from "@/lib/ai/config";
import { generateDiscretionaryInsight } from "@/lib/ai/generate-discretionary-insight";
import { saveDiscretionaryAiInsight } from "@/lib/ai/save-discretionary-ai-insight";
import type { DateRangeResult } from "@/lib/analytics/date-range";
import type { ContextFilter } from "@/lib/analytics/filters";

export interface RunGenerateDiscretionaryInsightInput {
  workspaceId: string;
  context: ContextFilter;
  range: DateRangeResult;
  config: AiConfig;
}

export async function runGenerateDiscretionaryInsight(
  input: RunGenerateDiscretionaryInsightInput,
): Promise<{ insight: string; message: string }> {
  const payload = await buildDiscretionaryInsightPayload(
    input.workspaceId,
    input.context,
    input.range,
  );
  if (!payload) {
    throw new Error(
      "Brak danych opcjonalnych — oznacz kategorie jako opcjonalne lub zaimportuj wyciąg.",
    );
  }

  const insight = await generateDiscretionaryInsight({
    config: input.config,
    payload,
  });

  await saveDiscretionaryAiInsight({
    workspaceId: input.workspaceId,
    context: input.context,
    config: input.config,
    contentMarkdown: insight,
    payload,
  });

  return {
    insight,
    message: "Raport AI o wydatkach opcjonalnych zapisany w historii.",
  };
}
