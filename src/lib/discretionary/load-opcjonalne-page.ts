import { loadDiscretionaryAiInsights } from "@/lib/ai/load-discretionary-ai-insight";
import { getWorkspaceAiStatus } from "@/lib/ai/status";
import type { DateRangeResult } from "@/lib/analytics/date-range";
import type { ContextFilter } from "@/lib/analytics/filters";
import { loadDiscretionaryPageData } from "@/lib/discretionary/load-discretionary-page";

export async function loadOpcjonalnePage(
  workspaceId: string,
  context: ContextFilter,
  range: DateRangeResult,
): Promise<{
  data: Awaited<ReturnType<typeof loadDiscretionaryPageData>>;
  aiStatus: Awaited<ReturnType<typeof getWorkspaceAiStatus>>;
  insightHistory: Awaited<ReturnType<typeof loadDiscretionaryAiInsights>>;
  canGenerateAi: boolean;
}> {
  const [data, aiStatus, insightHistory] = await Promise.all([
    loadDiscretionaryPageData(workspaceId, context, range),
    getWorkspaceAiStatus(workspaceId),
    loadDiscretionaryAiInsights(workspaceId, context),
  ]);

  const canGenerateAi =
    data.discretionaryCategoryIds.length > 0 ||
    data.summary.totalPln > 0 ||
    data.monthlyLimit !== null;

  return { data, aiStatus, insightHistory, canGenerateAi };
}
