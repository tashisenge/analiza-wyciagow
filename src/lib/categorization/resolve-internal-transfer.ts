import { isInternalTransfer } from "@/lib/transactions/is-internal-transfer";
import { TRANSFER_BETWEEN_ACCOUNTS_CATEGORY } from "@/lib/transactions/transfer-category";

export function resolveInternalTransferCategoryId(
  description: string,
  mbankCategory: string | undefined,
  categoriesByName: Map<string, string>,
): string | null {
  if (!isInternalTransfer({ description, mbankCategory })) {
    return null;
  }
  return categoriesByName.get(TRANSFER_BETWEEN_ACCOUNTS_CATEGORY) ?? null;
}
