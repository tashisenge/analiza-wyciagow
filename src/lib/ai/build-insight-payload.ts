import { filterTransactionsForInsight } from "@/lib/ai/filter-insight-transactions";
import { buildMonthlySummary } from "@/lib/ai/monthly-summary";
import type { InsightPromptContext } from "@/lib/ai/prompts/insights";
import type { ContextFilter } from "@/lib/analytics/filters";
import { prisma } from "@/lib/db";

export interface InsightPayloadResult {
  summary: ReturnType<typeof buildMonthlySummary>;
  periodLabel: string;
  promptContext: InsightPromptContext;
  transfersFiltered: number;
  excludedTxCount: number;
}

export async function buildInsightPayload(
  workspaceId: string,
  context: ContextFilter,
  accountIds: string[],
): Promise<InsightPayloadResult> {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: { analysisExcludedCategoryIds: true },
  });

  const excludedIds = workspace.analysisExcludedCategoryIds;
  const excludedCategories =
    excludedIds.length > 0
      ? await prisma.category.findMany({
          where: { id: { in: excludedIds }, workspaceId },
          select: { id: true, name: true },
        })
      : [];

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const transactions = await prisma.transaction.findMany({
    where: {
      workspaceId,
      accountId: { in: accountIds },
      bookedAt: { gte: prevStart, lte: now },
    },
    include: { category: true },
  });

  const filtered = filterTransactionsForInsight(transactions, excludedIds);

  const contextLabel = context === "razem" ? "" : ` (${context})`;
  const periodLabel = `${monthStart.toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}${contextLabel}`;

  const summary = buildMonthlySummary(filtered.included, periodLabel);

  return {
    summary,
    periodLabel,
    transfersFiltered: filtered.transfersFiltered,
    excludedTxCount: filtered.excludedByCategory,
    promptContext: {
      transfersFiltered: filtered.transfersFiltered,
      excludedByCategory: filtered.excludedByCategory,
      excludedCategoryNames: excludedCategories.map((category) => category.name),
    },
  };
}
