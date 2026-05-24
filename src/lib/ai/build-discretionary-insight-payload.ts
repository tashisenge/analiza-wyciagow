import {
  DISCRETIONARY_INSIGHT_KIND,
  type DiscretionaryInsightPayload,
} from "@/lib/ai/discretionary-insight-types";
import type { DateRangeResult } from "@/lib/analytics/date-range";
import type { ContextFilter } from "@/lib/analytics/filters";
import { prisma } from "@/lib/db";
import { loadDiscretionaryPageData } from "@/lib/discretionary/load-discretionary-page";

export async function buildDiscretionaryInsightPayload(
  workspaceId: string,
  context: ContextFilter,
  range: DateRangeResult,
): Promise<DiscretionaryInsightPayload | null> {
  const [data, discretionaryCategories] = await Promise.all([
    loadDiscretionaryPageData(workspaceId, context, range),
    prisma.category.findMany({
      where: { workspaceId, isDiscretionary: true },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (
    discretionaryCategories.length === 0 &&
    data.summary.totalPln === 0 &&
    data.monthlyLimit === null
  ) {
    return null;
  }

  const limitOverrun =
    data.monthlyLimit !== null &&
    data.limitUsedPercent !== null &&
    data.limitUsedPercent > 100;

  return {
    insightKind: DISCRETIONARY_INSIGHT_KIND,
    periodLabel: range.label,
    context,
    summary: data.summary,
    monthlyLimit: data.monthlyLimit,
    limitUsedPercent: data.limitUsedPercent,
    limitOverrun,
    coveragePercent: data.coveragePercent,
    discretionaryCategoryNames: discretionaryCategories.map((category) => category.name),
    topMerchants: data.merchants,
  };
}
