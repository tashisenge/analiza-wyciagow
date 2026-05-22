export interface CategoryRuleInput {
  id: string;
  categoryId: string;
  matchField: string;
  matchContains: string;
  priority: number;
}

export function matchCategoryRule(
  tx: { description: string; counterparty: string },
  rules: CategoryRuleInput[],
): string | null {
  const sorted = [...rules].sort((a, b) => b.priority - a.priority);
  for (const rule of sorted) {
    const haystack =
      rule.matchField === "counterparty" ? tx.counterparty : tx.description;
    if (haystack.toLowerCase().includes(rule.matchContains.toLowerCase())) {
      return rule.categoryId;
    }
  }
  return null;
}
