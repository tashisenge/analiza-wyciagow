import { resolveDateRange } from "@/lib/analytics/date-range";
import type { ContextFilter } from "@/lib/analytics/filters";
import { loadDiscretionaryPageData } from "@/lib/discretionary/load-discretionary-page";

export interface DiscretionaryInsightAddon {
  totalPln: number;
  shareOfExpensesPercent: number | null;
  vsPreviousPeriodPercent: number | null;
  monthlyLimit: number | null;
  limitUsedPercent: number | null;
  limitOverrun: boolean;
  topMerchants: { counterparty: string; totalPln: number }[];
}

export async function buildDiscretionaryInsightAddon(
  workspaceId: string,
  context: ContextFilter,
): Promise<DiscretionaryInsightAddon | null> {
  const now = new Date();
  const range = resolveDateRange("month", now, {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  const data = await loadDiscretionaryPageData(workspaceId, context, range);
  if (
    data.discretionaryCategoryIds.length === 0 &&
    data.summary.totalPln === 0 &&
    data.monthlyLimit === null
  ) {
    return null;
  }

  return {
    totalPln: data.summary.totalPln,
    shareOfExpensesPercent: data.summary.shareOfExpensesPercent,
    vsPreviousPeriodPercent: data.summary.vsPreviousPeriodPercent,
    monthlyLimit: data.monthlyLimit,
    limitUsedPercent: data.limitUsedPercent,
    limitOverrun:
      data.monthlyLimit !== null &&
      data.limitUsedPercent !== null &&
      data.limitUsedPercent > 100,
    topMerchants: data.merchants.slice(0, 5).map((row) => ({
      counterparty: row.counterparty,
      totalPln: row.totalPln,
    })),
  };
}
