import { TRANSFER_BETWEEN_ACCOUNTS_CATEGORY } from "@/lib/transactions/transfer-category";

export function resolveInternalTransferCategoryId(
  isPairedOwnAccountTransfer: boolean,
  categoriesByName: Map<string, string>,
): string | null {
  if (!isPairedOwnAccountTransfer) {
    return null;
  }
  return categoriesByName.get(TRANSFER_BETWEEN_ACCOUNTS_CATEGORY) ?? null;
}
