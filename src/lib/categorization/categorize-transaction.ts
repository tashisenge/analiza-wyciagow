import type { CategoryRuleInput } from "@/lib/categorization/apply-rules";
import type { MerchantMemoryInput } from "@/lib/categorization/merchant-memory";
import {
  resolveCategoryId,
  type TransactionForResolve,
} from "@/lib/categorization/resolve-category";

export type TransactionForCategory = TransactionForResolve;

export function categorizeTransaction(
  tx: TransactionForCategory,
  rules: CategoryRuleInput[],
  memories: MerchantMemoryInput[],
  categoriesByName: Map<string, string> = new Map<string, string>(),
): string | null {
  return resolveCategoryId(tx, rules, memories, categoriesByName);
}
