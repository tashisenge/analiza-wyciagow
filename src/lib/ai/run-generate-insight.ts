import type { AccountContext } from "@prisma/client";

import { buildInsightPayload } from "@/lib/ai/build-insight-payload";
import type { AiConfig } from "@/lib/ai/config";
import { generateSpendingInsights } from "@/lib/ai/generate-insights";
import { saveAiInsight } from "@/lib/ai/save-ai-insight";
import { prisma } from "@/lib/db";

export interface RunGenerateInsightInput {
  workspaceId: string;
  context: AccountContext;
  accountIds: string[];
  config: AiConfig;
}

export async function runGenerateInsight(
  input: RunGenerateInsightInput,
): Promise<{ insight: string; message: string }> {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: input.workspaceId },
    select: { analysisExcludedCategoryIds: true },
  });

  const payload = await buildInsightPayload(
    input.workspaceId,
    input.context,
    input.accountIds,
  );

  const insight = await generateSpendingInsights({
    config: input.config,
    summary: payload.summary,
    promptContext: payload.promptContext,
  });

  await saveAiInsight({
    workspaceId: input.workspaceId,
    context: input.context,
    config: input.config,
    contentMarkdown: insight,
    summary: payload.summary,
    excludedCategoryIds: workspace.analysisExcludedCategoryIds,
    transfersFiltered: payload.transfersFiltered,
    excludedTxCount: payload.excludedTxCount,
  });

  return { insight, message: "Analiza wygenerowana i zapisana w historii." };
}
