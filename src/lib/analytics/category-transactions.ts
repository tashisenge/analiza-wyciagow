export interface TxForCategoryGroup {
  id: string;
  amount: string;
  bookedAt: Date;
  counterparty: string;
  description: string;
  categoryId: string | null;
  categoryName: string;
}

export interface CategoryTransactionGroup {
  categoryKey: string;
  categoryId: string | null;
  categoryName: string;
  total: number;
  transactions: {
    id: string;
    bookedAt: string;
    counterparty: string;
    description: string;
    amount: string;
  }[];
}

function categoryKey(categoryId: string | null, categoryName: string): string {
  return categoryId ?? `mbank:${categoryName}`;
}

function isExpense(amount: string): boolean {
  return Number(amount) < 0;
}

function toPreviewRow(
  tx: TxForCategoryGroup,
): CategoryTransactionGroup["transactions"][number] {
  return {
    id: tx.id,
    bookedAt: tx.bookedAt.toISOString().slice(0, 10),
    counterparty: tx.counterparty || tx.description.slice(0, 40),
    description: tx.description.slice(0, 60),
    amount: tx.amount,
  };
}

function upsertGroup(
  groups: Map<string, CategoryTransactionGroup>,
  tx: TxForCategoryGroup,
  limitPerCategory: number,
): void {
  const key = categoryKey(tx.categoryId, tx.categoryName);
  const existing = groups.get(key) ?? {
    categoryKey: key,
    categoryId: tx.categoryId,
    categoryName: tx.categoryName,
    total: 0,
    transactions: [],
  };
  existing.total += Math.abs(Number(tx.amount));
  if (existing.transactions.length < limitPerCategory) {
    existing.transactions.push(toPreviewRow(tx));
  }
  groups.set(key, existing);
}

export function groupExpensesByCategory(
  transactions: TxForCategoryGroup[],
  limitPerCategory = 8,
): CategoryTransactionGroup[] {
  const groups = new Map<string, CategoryTransactionGroup>();

  for (const tx of transactions) {
    if (isExpense(tx.amount)) {
      upsertGroup(groups, tx, limitPerCategory);
    }
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      total: Math.round(group.total * 100) / 100,
    }))
    .sort((a, b) => b.total - a.total);
}
