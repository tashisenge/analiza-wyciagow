import type { ContextFilter } from "@/lib/analytics/filters";
import type {
  DiscretionaryMerchantRow,
  DiscretionaryPeriodSummary,
} from "@/lib/discretionary/types";

export const DISCRETIONARY_INSIGHT_KIND = "discretionary" as const;

export interface DiscretionaryInsightRequestParams {
  context: string;
  period: string;
  year: number;
  month: number;
}

export interface DiscretionaryInsightPayload {
  insightKind: typeof DISCRETIONARY_INSIGHT_KIND;
  periodLabel: string;
  context: ContextFilter;
  summary: DiscretionaryPeriodSummary;
  monthlyLimit: number | null;
  limitUsedPercent: number | null;
  limitOverrun: boolean;
  coveragePercent: number;
  discretionaryCategoryNames: string[];
  topMerchants: DiscretionaryMerchantRow[];
}

export function isDiscretionaryInsightPayload(
  value: unknown,
): value is DiscretionaryInsightPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as { insightKind?: string };
  return record.insightKind === DISCRETIONARY_INSIGHT_KIND;
}
