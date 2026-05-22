import type { DetectedOpportunity, TxForOptimization } from "@/lib/optimization/types";

export interface BudgetInput {
  categoryId: string;
  monthlyLimit: { toString(): string };
  categoryName: string;
}

function buildOverrun(
  budget: BudgetInput,
  spent: number,
  limit: number,
): DetectedOpportunity {
  const over = Math.round((spent - limit) * 100) / 100;
  return {
    type: "BUDGET_OVERRUN",
    title: `Przekroczony budżet: ${budget.categoryName}`,
    description: `Wydano ${spent.toFixed(2)} PLN przy limicie ${limit.toFixed(2)} PLN`,
    estimatedMonthlySavings: over,
    counterparty: null,
    categoryId: budget.categoryId,
    evidenceTransactionIds: [],
    dedupeKey: `BUDGET_OVERRUN:${budget.categoryId}`,
  };
}

function sumCategorySpend(current: TxForOptimization[], categoryId: string): number {
  return current
    .filter((tx) => tx.categoryId === categoryId && Number(tx.amount) < 0)
    .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);
}

export function detectBudgetOverruns(
  current: TxForOptimization[],
  budgets: BudgetInput[],
): DetectedOpportunity[] {
  return budgets
    .map((budget) => {
      const spent = sumCategorySpend(current, budget.categoryId);
      const limit = Number(budget.monthlyLimit);
      if (spent <= limit) {
        return null;
      }
      return buildOverrun(budget, spent, limit);
    })
    .filter((item): item is DetectedOpportunity => item !== null);
}
