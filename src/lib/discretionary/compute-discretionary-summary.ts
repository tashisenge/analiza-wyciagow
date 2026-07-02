import type { DiscretionaryPeriodSummary } from "@/lib/discretionary/types";

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? null : 100;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function sharePercent(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : null;
}

export function computeDiscretionarySummary(input: {
  currentDiscretionaryPln: number;
  currentDiscretionaryCount: number;
  currentTotalExpensesPln: number;
  currentTotalIncomePln: number;
  previousDiscretionaryPln: number;
}): DiscretionaryPeriodSummary {
  return {
    totalPln: input.currentDiscretionaryPln,
    transactionCount: input.currentDiscretionaryCount,
    shareOfExpensesPercent: sharePercent(
      input.currentDiscretionaryPln,
      input.currentTotalExpensesPln,
    ),
    shareOfIncomePercent: sharePercent(
      input.currentDiscretionaryPln,
      input.currentTotalIncomePln,
    ),
    vsPreviousPeriodPercent: percentChange(
      input.currentDiscretionaryPln,
      input.previousDiscretionaryPln,
    ),
  };
}
