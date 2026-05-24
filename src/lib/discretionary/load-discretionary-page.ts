import type { DateRangeResult } from "@/lib/analytics/date-range";
import { accountIdsForContext, type ContextFilter } from "@/lib/analytics/filters";
import { prisma } from "@/lib/db";
import { assembleDiscretionaryPage } from "@/lib/discretionary/assemble-discretionary-page";
import {
  fetchDiscretionaryBudget,
  fetchDiscretionaryCategoryIds,
  fetchDiscretionaryTransactions,
} from "@/lib/discretionary/fetch-discretionary-data";
import type { DiscretionaryMerchantRow, DiscretionaryPeriodSummary } from "@/lib/discretionary/types";

export interface DiscretionaryPageData {
  summary: DiscretionaryPeriodSummary;
  merchants: DiscretionaryMerchantRow[];
  monthlyLimit: number | null;
  limitUsedPercent: number | null;
  discretionaryCategoryIds: string[];
  coveragePercent: number;
}

export async function loadDiscretionaryPageData(
  workspaceId: string,
  context: ContextFilter,
  range: DateRangeResult,
): Promise<DiscretionaryPageData> {
  const accounts = await prisma.account.findMany({ where: { workspaceId } });
  const accountIds = accountIdsForContext(accounts, context);
  const [transactions, budget, discretionaryCategories] = await Promise.all([
    fetchDiscretionaryTransactions(workspaceId, accountIds, range),
    fetchDiscretionaryBudget(workspaceId, context),
    fetchDiscretionaryCategoryIds(workspaceId),
  ]);
  return assembleDiscretionaryPage({
    transactions,
    monthlyLimit: budget ? Number(budget.monthlyLimit) : null,
    discretionaryCategoryIds: discretionaryCategories.map((category) => category.id),
    range,
  });
}
