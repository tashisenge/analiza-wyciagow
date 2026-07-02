import { loadAiInsightHistory } from "@/lib/ai/load-ai-insight-history";
import { getWorkspaceAiStatus } from "@/lib/ai/status";
import { parseDashboardParams } from "@/lib/analytics/dashboard-params";
import { resolveDateRange } from "@/lib/analytics/date-range";
import { loadDashboardData } from "@/lib/analytics/load-dashboard";
import { prisma } from "@/lib/db";
import { loadImportFreshness } from "@/lib/import/load-import-freshness";

export async function loadDashboardPageContext(
  searchParams: { context?: string; period?: string; year?: string; month?: string },
  workspaceId: string,
): Promise<{
  context: ReturnType<typeof parseDashboardParams>["context"];
  period: string;
  year: number;
  month: number;
  range: ReturnType<typeof resolveDateRange>;
  data: Awaited<ReturnType<typeof loadDashboardData>>;
  aiStatus: Awaited<ReturnType<typeof getWorkspaceAiStatus>>;
  insightHistory: Awaited<ReturnType<typeof loadAiInsightHistory>>;
  excludedCategoryCount: number;
  importFreshness: Awaited<ReturnType<typeof loadImportFreshness>>;
}> {
  const {
    context,
    period,
    year: yearParam,
    month: monthParam,
  } = parseDashboardParams(searchParams);
  const now = new Date();
  const year = yearParam ?? now.getFullYear();
  const month = monthParam ?? now.getMonth() + 1;
  const range = resolveDateRange(period, now, {
    year: period === "month" || period === "year" ? year : undefined,
    month: period === "month" ? month : undefined,
  });
  const [data, aiStatus, insightHistory, workspace, importFreshness] = await Promise.all([
    loadDashboardData(workspaceId, context, range),
    getWorkspaceAiStatus(workspaceId),
    loadAiInsightHistory(workspaceId),
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { analysisExcludedCategoryIds: true },
    }),
    loadImportFreshness(workspaceId),
  ]);
  return {
    context,
    period,
    year,
    month,
    range,
    data,
    aiStatus,
    insightHistory,
    excludedCategoryCount: workspace?.analysisExcludedCategoryIds.length ?? 0,
    importFreshness,
  };
}
