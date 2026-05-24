import { completeWithAi, type FetchFn } from "@/lib/ai/complete";
import type { AiConfig } from "@/lib/ai/config";
import {
  buildInsightSystemPrompt,
  type InsightPromptContext,
} from "@/lib/ai/prompts/insights";

export interface SpendingSummaryForAi {
  periodLabel: string;
  totalExpenses: number;
  totalIncome: number;
  transactionCount: number;
  topCategories: { name: string; total: number; percent: number }[];
  topMerchants: { name: string; total: number; changePercent: number | null }[];
  uncategorizedCount: number;
  discretionary?: {
    totalPln: number;
    shareOfExpensesPercent: number | null;
    vsPreviousPeriodPercent: number | null;
    monthlyLimit: number | null;
    limitUsedPercent: number | null;
    limitOverrun: boolean;
    topMerchants: { counterparty: string; totalPln: number }[];
  };
  dataNote?: string;
}

export interface GenerateInsightsOptions {
  config: AiConfig;
  summary: SpendingSummaryForAi;
  promptContext: InsightPromptContext;
  fetchFn?: FetchFn;
}

export async function generateSpendingInsights(
  options: GenerateInsightsOptions,
): Promise<string> {
  const { config, summary, promptContext, fetchFn } = options;
  const payload = {
    ...summary,
    dataNote:
      promptContext.transfersFiltered > 0 || promptContext.excludedByCategory > 0
        ? {
            transfersOmitted: promptContext.transfersFiltered,
            excludedCategories: promptContext.excludedCategoryNames,
            excludedTxCount: promptContext.excludedByCategory,
          }
        : undefined,
  };
  const user = `Okres: ${summary.periodLabel}\nDane:\n${JSON.stringify(payload, null, 2)}`;
  return completeWithAi(
    config,
    {
      system: buildInsightSystemPrompt(promptContext),
      user,
      maxTokens: 1800,
    },
    fetchFn,
  );
}
