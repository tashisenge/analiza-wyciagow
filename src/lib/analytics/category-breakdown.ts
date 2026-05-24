export interface TxForCategoryBreakdown {
  amount: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor?: string | null;
}

export interface CategorySlice {
  categoryId: string | null;
  categoryName: string;
  categoryColor: string | null;
  total: number;
  percent: number;
}

function isExpense(amount: string): boolean {
  return Number(amount) < 0;
}

function accumulateExpenses(
  expenses: TxForCategoryBreakdown[],
): Map<string, { name: string; color: string | null; total: number }> {
  const byCategory = new Map<
    string,
    { name: string; color: string | null; total: number }
  >();

  for (const tx of expenses) {
    const name = tx.categoryName ?? "Bez kategorii";
    const key = tx.categoryId ?? `mbank:${name}`;
    const prev = byCategory.get(key) ?? {
      name,
      color: tx.categoryColor ?? null,
      total: 0,
    };
    prev.total += Math.abs(Number(tx.amount));
    byCategory.set(key, prev);
  }

  return byCategory;
}

export function categoryBreakdown(
  transactions: TxForCategoryBreakdown[],
): CategorySlice[] {
  const byCategory = accumulateExpenses(
    transactions.filter((tx) => isExpense(tx.amount)),
  );
  const sum = [...byCategory.values()].reduce((acc, item) => acc + item.total, 0) || 1;

  return [...byCategory.entries()]
    .map(([categoryId, value]) => ({
      categoryId: categoryId.startsWith("mbank:") ? null : categoryId,
      categoryName: value.name,
      categoryColor: value.color,
      total: Math.round(value.total * 100) / 100,
      percent: Math.round((value.total / sum) * 1000) / 10,
    }))
    .sort((a, b) => b.total - a.total);
}
