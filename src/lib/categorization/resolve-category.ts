import type { CategoryRuleInput } from "@/lib/categorization/apply-rules";
import { matchCategoryRule } from "@/lib/categorization/apply-rules";
import type { MerchantMemoryInput } from "@/lib/categorization/merchant-memory";
import { resolveMerchantCategory } from "@/lib/categorization/merchant-memory";
import {
  normalizeMbankCategoryName,
  resolveCategoryIdByName,
} from "@/lib/mbank-category-map";

export interface TransactionForResolve {
  description: string;
  counterparty: string;
  mbankCategory?: string;
}

export function resolveCategoryId(
  tx: TransactionForResolve,
  rules: CategoryRuleInput[],
  memories: MerchantMemoryInput[],
  categoriesByName: Map<string, string>,
): string | null {
  const fromRule = matchCategoryRule(tx, rules);
  if (fromRule) {
    return fromRule;
  }

  const fromMemory = resolveMerchantCategory(tx.counterparty, memories);
  if (fromMemory) {
    return fromMemory;
  }

  if (tx.mbankCategory) {
    const name = normalizeMbankCategoryName(tx.mbankCategory);
    if (name) {
      return resolveCategoryIdByName(name, categoriesByName);
    }
  }

  return null;
}
