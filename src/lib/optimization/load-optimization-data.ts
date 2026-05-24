import type { Prisma } from "@prisma/client";

import type { ContextFilter } from "@/lib/analytics/filters";
import { prisma } from "@/lib/db";
import {
  fetchAccountIds,
  fetchBudgetsForContext,
  sixMonthsAgo,
} from "@/lib/optimization/fetch-optimization-inputs";
import {
  dismissFixedCategoryOpportunities,
  optimizableTransactionsWhere,
  visibleOpenOpportunityWhere,
} from "@/lib/optimization/filter-transactions";
import { loadBudgetSpentRows } from "@/lib/optimization/load-budget-spent";
import { mapTransactionsForOptimization } from "@/lib/optimization/map-transactions";
import { runDetectionForMonth } from "@/lib/optimization/run-detection";
import {
  upsertOpportunities,
  verifyImplementedSavings,
} from "@/lib/optimization/upsert-opportunities";

const opportunityInclude = { category: true, research: true } as const;

export type OpportunityWithRelations = Prisma.OptimizationOpportunityGetPayload<{
  include: typeof opportunityInclude;
}>;

async function runFollowUpVerification(
  workspaceId: string,
  mapped: ReturnType<typeof mapTransactionsForOptimization>,
  anchor: Date,
): Promise<void> {
  const thirtyDaysAgo = new Date(anchor.getTime() - 30 * 24 * 60 * 60 * 1000);
  await verifyImplementedSavings({
    prisma,
    workspaceId,
    beforeTxs: mapped.filter(
      (tx) =>
        tx.bookedAt >= new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000) &&
        tx.bookedAt < thirtyDaysAgo,
    ),
    afterTxs: mapped.filter((tx) => tx.bookedAt >= thirtyDaysAgo),
  });
}

export async function refreshWorkspaceOpportunities(
  workspaceId: string,
  context: ContextFilter,
): Promise<number> {
  const accountIds = await fetchAccountIds(workspaceId, context);
  const anchor = new Date();
  await dismissFixedCategoryOpportunities(workspaceId);
  const allTxs = await prisma.transaction.findMany({
    where: optimizableTransactionsWhere(workspaceId, accountIds, sixMonthsAgo(anchor)),
    include: { category: true },
  });
  const mapped = mapTransactionsForOptimization(allTxs);
  const detected = await runDetectionForMonth({ workspaceId, context, mapped, anchor });
  await runFollowUpVerification(workspaceId, mapped, anchor);
  return upsertOpportunities({
    prisma,
    workspaceId,
    accountContext: context,
    detected,
    anchor,
  });
}

async function loadOpenOpportunities(
  workspaceId: string,
  context: ContextFilter,
): Promise<OpportunityWithRelations[]> {
  return prisma.optimizationOpportunity.findMany({
    where: visibleOpenOpportunityWhere(workspaceId, context),
    include: opportunityInclude,
    orderBy: { estimatedMonthlySavings: "desc" },
  });
}

async function loadImplementedOpportunities(
  workspaceId: string,
  context: ContextFilter,
  monthStart: Date,
): Promise<OpportunityWithRelations[]> {
  return prisma.optimizationOpportunity.findMany({
    where: {
      workspaceId,
      status: "IMPLEMENTED",
      accountContext: context,
      resolvedAt: { gte: monthStart },
    },
    include: opportunityInclude,
    orderBy: { resolvedAt: "desc" },
  });
}

type OpportunityList = Awaited<ReturnType<typeof loadOpenOpportunities>>;

interface OptimizePageData {
  open: OpportunityList;
  implemented: OpportunityList;
  dismissedCount: number;
  budgets: Awaited<ReturnType<typeof loadBudgetSpentRows>>;
  categories: { id: string; name: string }[];
}

async function fetchOptimizePageCore(
  workspaceId: string,
  context: ContextFilter,
  monthStart: Date,
): Promise<
  Omit<OptimizePageData, "budgets"> & {
    budgets: Awaited<ReturnType<typeof fetchBudgetsForContext>>;
  }
> {
  const [open, implemented, dismissedCount, budgets, categories] = await Promise.all([
    loadOpenOpportunities(workspaceId, context),
    loadImplementedOpportunities(workspaceId, context, monthStart),
    prisma.optimizationOpportunity.count({
      where: { workspaceId, status: "DISMISSED", accountContext: context },
    }),
    fetchBudgetsForContext(workspaceId, context),
    prisma.category.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
  ]);
  return { open, implemented, dismissedCount, budgets, categories };
}

export async function loadOptimizePageData(
  workspaceId: string,
  context: ContextFilter,
): Promise<OptimizePageData> {
  await dismissFixedCategoryOpportunities(workspaceId);
  const accountIds = await fetchAccountIds(workspaceId, context);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const core = await fetchOptimizePageCore(workspaceId, context, monthStart);
  const budgetSpent = await loadBudgetSpentRows({
    workspaceId,
    accountIds,
    budgets: core.budgets,
    monthStart,
  });
  return { ...core, budgets: budgetSpent };
}

export type { OptimizePageData };
