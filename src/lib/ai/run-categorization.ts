import { applyCategoryAssignments } from "@/lib/ai/apply-assignments";
import { AI_BATCH_SIZE, categorizeBatchWithAi } from "@/lib/ai/categorize-batch";
import type { AiConfig } from "@/lib/ai/config";

interface UncategorizedTx {
  id: string;
  description: string;
  counterparty: string;
  amount: { toString(): string };
  mbankCategory: string;
}

export interface RunCategorizationOptions {
  config: AiConfig;
  workspaceId: string;
  uncategorized: UncategorizedTx[];
  categoryNames: string[];
  byName: Map<string, string>;
}

export async function categorizeUncategorizedWithAi(
  options: RunCategorizationOptions,
): Promise<number> {
  const { config, workspaceId, uncategorized, categoryNames, byName } = options;
  let total = 0;
  for (let i = 0; i < uncategorized.length; i += AI_BATCH_SIZE) {
    const batch = uncategorized.slice(i, i + AI_BATCH_SIZE);
    const assignments = await categorizeBatchWithAi({
      config,
      transactions: batch.map((tx) => ({
        id: tx.id,
        description: tx.description,
        counterparty: tx.counterparty,
        amount: tx.amount.toString(),
        mbankCategory: tx.mbankCategory,
      })),
      categoryNames: categoryNames,
    });
    total += await applyCategoryAssignments(assignments, byName, workspaceId);
  }
  return total;
}
