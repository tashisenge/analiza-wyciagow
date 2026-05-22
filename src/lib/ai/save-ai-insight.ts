import type { AccountContext, Prisma } from "@prisma/client";

import type { AiConfig } from "@/lib/ai/config";
import type { SpendingSummaryForAi } from "@/lib/ai/generate-insights";
import { prisma } from "@/lib/db";

export interface SaveAiInsightInput {
  workspaceId: string;
  context: AccountContext;
  config: AiConfig;
  contentMarkdown: string;
  summary: SpendingSummaryForAi;
  excludedCategoryIds: string[];
  transfersFiltered: number;
  excludedTxCount: number;
}

export async function saveAiInsight(input: SaveAiInsightInput): Promise<string> {
  const record = await prisma.aiInsight.create({
    data: {
      workspaceId: input.workspaceId,
      context: input.context,
      provider: input.config.provider,
      model: input.config.model,
      contentMarkdown: input.contentMarkdown,
      summaryJson: input.summary as unknown as Prisma.InputJsonValue,
      excludedCategoryIds: input.excludedCategoryIds,
      transfersFiltered: input.transfersFiltered,
      excludedTxCount: input.excludedTxCount,
    },
  });
  await prisma.workspace.update({
    where: { id: input.workspaceId },
    data: {
      lastAiInsight: input.contentMarkdown,
      lastAiInsightAt: new Date(),
    },
  });
  return record.id;
}
