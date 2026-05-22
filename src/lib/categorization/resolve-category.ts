import type { CategoryRuleInput } from "@/lib/categorization/apply-rules";
import { matchCategoryRule } from "@/lib/categorization/apply-rules";
import type { MerchantMemoryInput } from "@/lib/categorization/merchant-memory";
import { resolveMerchantCategory } from "@/lib/categorization/merchant-memory";
import { resolveInternalTransferCategoryId } from "@/lib/categorization/resolve-internal-transfer";
import { resolveMbankCategoryId } from "@/lib/categorization/resolve-mbank-category";

export interface TransactionForResolve {
  description: string;
  counterparty: string;
  mbankCategory?: string;
  isPairedOwnAccountTransfer?: boolean;
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

  const transferId = resolveInternalTransferCategoryId(
    tx.isPairedOwnAccountTransfer ?? false,
    categoriesByName,
  );
  if (transferId) {
    return transferId;
  }

  return resolveMbankCategoryId(tx.mbankCategory, categoriesByName);
}
