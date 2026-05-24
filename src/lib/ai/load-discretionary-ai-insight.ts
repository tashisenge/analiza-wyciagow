import type { AccountContext } from "@prisma/client";

import { isDiscretionaryInsightPayload } from "@/lib/ai/discretionary-insight-types";
import { prisma } from "@/lib/db";

export interface DiscretionaryAiInsightEntry {
  id: string;
  context: AccountContext;
  provider: string;
  model: string;
  contentMarkdown: string;
  periodLabel: string;
  createdAt: Date;
}

export async function loadDiscretionaryAiInsights(
  workspaceId: string,
  context: AccountContext,
  limit = 8,
): Promise<DiscretionaryAiInsightEntry[]> {
  const rows = await prisma.aiInsight.findMany({
    where: { workspaceId, context },
    orderBy: { createdAt: "desc" },
    take: limit * 3,
    select: {
      id: true,
      context: true,
      provider: true,
      model: true,
      contentMarkdown: true,
      summaryJson: true,
      createdAt: true,
    },
  });

  const entries: DiscretionaryAiInsightEntry[] = [];
  for (const row of rows) {
    if (!isDiscretionaryInsightPayload(row.summaryJson)) {
      continue;
    }
    entries.push({
      id: row.id,
      context: row.context,
      provider: row.provider,
      model: row.model,
      contentMarkdown: row.contentMarkdown,
      periodLabel: row.summaryJson.periodLabel,
      createdAt: row.createdAt,
    });
    if (entries.length >= limit) {
      break;
    }
  }
  return entries;
}
