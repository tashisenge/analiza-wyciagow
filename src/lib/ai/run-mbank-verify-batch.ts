import type { AiConfig } from "@/lib/ai/config";
import type { MbankVerifySuggestion } from "@/lib/ai/verify-mbank-assignments";
import { verifyMbankAssignmentsWithAi } from "@/lib/ai/verify-mbank-assignments";
import type { ReviewQueueItem } from "@/lib/review/load-review-queue";

export const MBANK_VERIFY_BATCH_SIZE = 50;

export async function runMbankVerifyBatch(options: {
  config: AiConfig;
  items: ReviewQueueItem[];
  categoryNames: string[];
}): Promise<Map<string, MbankVerifySuggestion>> {
  const batch = options.items.slice(0, MBANK_VERIFY_BATCH_SIZE);
  return verifyMbankAssignmentsWithAi({
    config: options.config,
    categoryNames: options.categoryNames,
    transactions: batch.map((item) => ({
      id: item.id,
      description: item.description,
      counterparty: item.counterparty,
      amount: item.amount,
      mbankCategory: item.mbankCategory,
      appCategoryName: item.categoryName,
    })),
  });
}
