import type { AccountContext, Prisma } from "@prisma/client";

import type { AiConfig } from "@/lib/ai/config";
import type { DiscretionaryInsightPayload } from "@/lib/ai/discretionary-insight-types";
import { prisma } from "@/lib/db";

export interface SaveDiscretionaryAiInsightInput {
  workspaceId: string;
  context: AccountContext;
  config: AiConfig;
  contentMarkdown: string;
  payload: DiscretionaryInsightPayload;
}

export async function saveDiscretionaryAiInsight(
  input: SaveDiscretionaryAiInsightInput,
): Promise<string> {
  const record = await prisma.aiInsight.create({
    data: {
      workspaceId: input.workspaceId,
      context: input.context,
      provider: input.config.provider,
      model: input.config.model,
      contentMarkdown: input.contentMarkdown,
      summaryJson: input.payload as unknown as Prisma.InputJsonValue,
      excludedCategoryIds: [],
      transfersFiltered: 0,
      excludedTxCount: 0,
    },
  });
  return record.id;
}
