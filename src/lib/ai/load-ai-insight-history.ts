import type { AccountContext } from "@prisma/client";

import { prisma } from "@/lib/db";

export interface AiInsightHistoryItem {
  id: string;
  context: AccountContext;
  provider: string;
  model: string;
  contentMarkdown: string;
  transfersFiltered: number;
  excludedTxCount: number;
  createdAt: Date;
}

export async function loadAiInsightHistory(
  workspaceId: string,
  limit = 15,
): Promise<AiInsightHistoryItem[]> {
  return prisma.aiInsight.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      context: true,
      provider: true,
      model: true,
      contentMarkdown: true,
      transfersFiltered: true,
      excludedTxCount: true,
      createdAt: true,
    },
  });
}
