import type { ContextFilter } from "@/lib/analytics/filters";
import { buildOpportunities } from "@/lib/optimization/build-opportunities";
import { fetchBudgetsForContext } from "@/lib/optimization/fetch-optimization-inputs";
import type { DetectedOpportunity, TxForOptimization } from "@/lib/optimization/types";

export interface RunDetectionOptions {
  workspaceId: string;
  context: ContextFilter;
  mapped: TxForOptimization[];
  anchor: Date;
}

export async function runDetectionForMonth(
  options: RunDetectionOptions,
): Promise<DetectedOpportunity[]> {
  const monthStart = new Date(options.anchor.getFullYear(), options.anchor.getMonth(), 1);
  const budgets = await fetchBudgetsForContext(options.workspaceId, options.context);
  return buildOpportunities({
    current: options.mapped.filter((tx) => tx.bookedAt >= monthStart),
    history: options.mapped.filter((tx) => tx.bookedAt < monthStart),
    budgets: budgets.map((b) => ({
      categoryId: b.categoryId,
      monthlyLimit: b.monthlyLimit,
      categoryName: b.category.name,
    })),
    anchor: options.anchor,
  });
}
