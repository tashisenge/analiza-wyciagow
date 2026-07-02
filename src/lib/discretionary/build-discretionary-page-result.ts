import { aggregateDiscretionaryMerchants } from "@/lib/discretionary/aggregate-discretionary-merchants";
import { computeDiscretionaryByPerson } from "@/lib/discretionary/compute-discretionary-by-person";
import { expenseCoveragePercent } from "@/lib/discretionary/expense-coverage-percent";
import type { mapDiscretionaryPeriods } from "@/lib/discretionary/map-discretionary-periods";
import type {
  DiscretionaryMerchantRow,
  DiscretionaryPeriodSummary,
  DiscretionaryPersonRow,
} from "@/lib/discretionary/types";

function limitUsedPercent(
  summaryTotal: number,
  monthlyLimit: number | null,
): number | null {
  if (monthlyLimit === null || monthlyLimit <= 0) {
    return null;
  }
  return Math.round((summaryTotal / monthlyLimit) * 1000) / 10;
}

function discretionaryMerchants(
  periods: ReturnType<typeof mapDiscretionaryPeriods>,
): DiscretionaryMerchantRow[] {
  return aggregateDiscretionaryMerchants(
    periods.currentMapped,
    periods.previousMapped,
    5,
  );
}

function discretionaryPersonBreakdown(
  periods: ReturnType<typeof mapDiscretionaryPeriods>,
): DiscretionaryPersonRow[] {
  return computeDiscretionaryByPerson(periods.currentMapped);
}

export interface DiscretionaryPageResult {
  summary: DiscretionaryPeriodSummary;
  merchants: DiscretionaryMerchantRow[];
  personBreakdown: DiscretionaryPersonRow[];
  monthlyLimit: number | null;
  limitUsedPercent: number | null;
  discretionaryCategoryIds: string[];
  coveragePercent: number;
}

export function buildDiscretionaryPageResult(input: {
  summary: DiscretionaryPeriodSummary;
  monthlyLimit: number | null;
  discretionaryCategoryIds: string[];
  periods: ReturnType<typeof mapDiscretionaryPeriods>;
}): DiscretionaryPageResult {
  return {
    summary: input.summary,
    merchants: discretionaryMerchants(input.periods),
    personBreakdown: discretionaryPersonBreakdown(input.periods),
    monthlyLimit: input.monthlyLimit,
    limitUsedPercent: limitUsedPercent(input.summary.totalPln, input.monthlyLimit),
    discretionaryCategoryIds: input.discretionaryCategoryIds,
    coveragePercent: expenseCoveragePercent(
      input.periods.current,
      input.periods.pairedKeys,
    ),
  };
}
