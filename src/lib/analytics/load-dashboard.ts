import { countAiCategorizationTargets } from "@/lib/ai/ai-target-transactions";
import { categoryBreakdown } from "@/lib/analytics/category-breakdown";
import { groupExpensesByCategory } from "@/lib/analytics/category-transactions";
import type { DateRangeResult } from "@/lib/analytics/date-range";
import { fetchDashboardOpportunities } from "@/lib/analytics/fetch-dashboard-opportunities";
import { accountIdsForContext, type ContextFilter } from "@/lib/analytics/filters";
import { summarizePeriod } from "@/lib/analytics/period-summary";
import { shouldCountInAnalytics } from "@/lib/analytics/should-count-in-analytics";
import { topMerchants } from "@/lib/analytics/top-merchants";
import { prisma } from "@/lib/db";
import { transactionCategoryLabel } from "@/lib/transaction-category-label";

type TxWithCategory = Awaited<
  ReturnType<typeof prisma.transaction.findMany<{ include: { category: true } }>>
>[number];

export interface DashboardOpportunity {
  id: string;
  title: string;
  type: string;
  estimatedMonthlySavings: { toString(): string } | null;
}

export interface DashboardData {
  summary: ReturnType<typeof summarizePeriod>;
  previousSummary: ReturnType<typeof summarizePeriod>;
  slices: ReturnType<typeof categoryBreakdown>;
  categoryGroups: ReturnType<typeof groupExpensesByCategory>;
  merchants: ReturnType<typeof topMerchants>;
  uncategorized: number;
  categorizedPercent: number;
  aiTargetCount: number;
  lastAiInsight: string | null;
  lastAiInsightAt: Date | null;
  topOpportunities: DashboardOpportunity[];
  budgetOverrunCount: number;
}

function splitByPeriod(
  transactions: TxWithCategory[],
  range: DateRangeResult,
): { current: TxWithCategory[]; previous: TxWithCategory[] } {
  const current = transactions.filter((tx) => tx.bookedAt >= range.currentStart);
  const previous = transactions.filter(
    (tx) => tx.bookedAt >= range.previousStart && tx.bookedAt < range.currentStart,
  );
  return { current, previous };
}

function mapToCategoryGroups(
  current: TxWithCategory[],
): ReturnType<typeof groupExpensesByCategory> {
  return groupExpensesByCategory(
    current.map((tx) => ({
      id: tx.id,
      amount: tx.amount.toString(),
      bookedAt: tx.bookedAt,
      counterparty: tx.counterparty,
      description: tx.description,
      categoryId: tx.categoryId,
      categoryName: transactionCategoryLabel(tx),
    })),
  );
}

function coveragePercent(uncategorized: number, totalInPeriod: number): number {
  if (totalInPeriod === 0) {
    return 100;
  }
  return Math.round(((totalInPeriod - uncategorized) / totalInPeriod) * 1000) / 10;
}

async function fetchDashboardRaw(
  workspaceId: string,
  accountIds: string[],
  range: DateRangeResult,
  context: ContextFilter,
): Promise<{
  transactions: TxWithCategory[];
  workspace: { lastAiInsight: string | null; lastAiInsightAt: Date | null } | null;
  aiTargetCount: number;
  totalInPeriod: number;
  topOpportunities: DashboardOpportunity[];
  budgetOverrunCount: number;
}> {
  const [transactions, workspace, aiTargetCount, totalInPeriod, opportunities] =
    await Promise.all([
      prisma.transaction.findMany({
        where: {
          workspaceId,
          accountId: { in: accountIds },
          bookedAt: { gte: range.previousStart, lte: range.currentEnd },
        },
        include: { category: true },
      }),
      prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { lastAiInsight: true, lastAiInsightAt: true },
      }),
      countAiCategorizationTargets(workspaceId),
      prisma.transaction.count({
        where: {
          workspaceId,
          accountId: { in: accountIds },
          bookedAt: { gte: range.currentStart, lte: range.currentEnd },
        },
      }),
      fetchDashboardOpportunities(workspaceId, context),
    ]);
  return {
    transactions,
    workspace,
    aiTargetCount,
    totalInPeriod,
    topOpportunities: opportunities.topOpportunities,
    budgetOverrunCount: opportunities.budgetOverrunCount,
  };
}

function analyticsTransactions(transactions: TxWithCategory[]): TxWithCategory[] {
  return transactions.filter((tx) =>
    shouldCountInAnalytics({
      description: tx.description,
      mbankCategory: tx.mbankCategory,
      category: tx.category,
    }),
  );
}

function buildDashboardMetrics(
  current: TxWithCategory[],
  previous: TxWithCategory[],
  uncategorized: number,
  totalInPeriod: number,
): Pick<
  DashboardData,
  | "summary"
  | "previousSummary"
  | "slices"
  | "categoryGroups"
  | "merchants"
  | "categorizedPercent"
> {
  const currentForAnalytics = analyticsTransactions(current);
  const previousForAnalytics = analyticsTransactions(previous);

  return {
    summary: summarizePeriod(
      currentForAnalytics.map((tx) => ({ amount: tx.amount.toString() })),
    ),
    previousSummary: summarizePeriod(
      previousForAnalytics.map((tx) => ({ amount: tx.amount.toString() })),
    ),
    slices: categoryBreakdown(
      currentForAnalytics.map((tx) => ({
        amount: tx.amount.toString(),
        categoryId: tx.categoryId,
        categoryName: transactionCategoryLabel(tx),
      })),
    ),
    categoryGroups: mapToCategoryGroups(currentForAnalytics),
    merchants: topMerchants(
      currentForAnalytics.map((tx) => ({
        counterparty: tx.counterparty,
        amount: tx.amount.toString(),
      })),
      previousForAnalytics.map((tx) => ({
        counterparty: tx.counterparty,
        amount: tx.amount.toString(),
      })),
    ),
    categorizedPercent: coveragePercent(uncategorized, totalInPeriod),
  };
}

export async function loadDashboardData(
  workspaceId: string,
  context: ContextFilter,
  range: DateRangeResult,
): Promise<DashboardData> {
  const accounts = await prisma.account.findMany({ where: { workspaceId } });
  const accountIds = accountIdsForContext(accounts, context);
  const raw = await fetchDashboardRaw(workspaceId, accountIds, range, context);
  const { current, previous } = splitByPeriod(raw.transactions, range);
  const uncategorized = current.filter((tx) => !tx.categoryId).length;

  return {
    ...buildDashboardMetrics(current, previous, uncategorized, raw.totalInPeriod),
    uncategorized,
    aiTargetCount: raw.aiTargetCount,
    lastAiInsight: raw.workspace?.lastAiInsight ?? null,
    lastAiInsightAt: raw.workspace?.lastAiInsightAt ?? null,
    topOpportunities: raw.topOpportunities,
    budgetOverrunCount: raw.budgetOverrunCount,
  };
}
