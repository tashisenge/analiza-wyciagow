import type { DateRangeResult } from "@/lib/analytics/date-range";
import { buildDiscretionaryPageResult } from "@/lib/discretionary/build-discretionary-page-result";
import { computeDiscretionarySummary } from "@/lib/discretionary/compute-discretionary-summary";
import type { TxWithCategory } from "@/lib/discretionary/discretionary-tx";
import { mapDiscretionaryPeriods } from "@/lib/discretionary/map-discretionary-periods";
import {
  sumDiscretionaryPln,
  sumExpensePln,
} from "@/lib/discretionary/map-transactions-for-discretionary";
import type { DiscretionaryPeriodSummary } from "@/lib/discretionary/types";

function buildSummary(
  currentMapped: ReturnType<typeof mapDiscretionaryPeriods>["currentMapped"],
  previousMapped: ReturnType<typeof mapDiscretionaryPeriods>["previousMapped"],
): DiscretionaryPeriodSummary {
  const currentDiscretionary = sumDiscretionaryPln(currentMapped);
  const previousDiscretionary = sumDiscretionaryPln(previousMapped);

  return computeDiscretionarySummary({
    currentDiscretionaryPln: currentDiscretionary.totalPln,
    currentDiscretionaryCount: currentDiscretionary.count,
    currentTotalExpensesPln: sumExpensePln(currentMapped),
    previousDiscretionaryPln: previousDiscretionary.totalPln,
  });
}

export function assembleDiscretionaryPage(input: {
  transactions: TxWithCategory[];
  monthlyLimit: number | null;
  discretionaryCategoryIds: string[];
  range: DateRangeResult;
}): ReturnType<typeof buildDiscretionaryPageResult> {
  const periods = mapDiscretionaryPeriods(input.transactions, input.range);
  return buildDiscretionaryPageResult({
    summary: buildSummary(periods.currentMapped, periods.previousMapped),
    monthlyLimit: input.monthlyLimit,
    discretionaryCategoryIds: input.discretionaryCategoryIds,
    periods,
  });
}
