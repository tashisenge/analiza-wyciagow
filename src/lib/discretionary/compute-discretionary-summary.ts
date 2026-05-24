import type { DiscretionaryPeriodSummary } from "@/lib/discretionary/types";

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? null : 100;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function computeDiscretionarySummary(input: {
  currentDiscretionaryPln: number;
  currentDiscretionaryCount: number;
  currentTotalExpensesPln: number;
  previousDiscretionaryPln: number;
}): DiscretionaryPeriodSummary {
  const shareOfExpensesPercent =
    input.currentTotalExpensesPln > 0
      ? Math.round(
          (input.currentDiscretionaryPln / input.currentTotalExpensesPln) * 1000,
        ) / 10
      : null;

  return {
    totalPln: input.currentDiscretionaryPln,
    transactionCount: input.currentDiscretionaryCount,
    shareOfExpensesPercent,
    vsPreviousPeriodPercent: percentChange(
      input.currentDiscretionaryPln,
      input.previousDiscretionaryPln,
    ),
  };
}
