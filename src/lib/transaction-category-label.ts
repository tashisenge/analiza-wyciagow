import { normalizeMbankCategoryName } from "@/lib/mbank/category-names";

interface TxWithCategory {
  category?: { name: string } | null;
  mbankCategory: string;
}

export function transactionCategoryLabel(tx: TxWithCategory): string {
  if (tx.category?.name) {
    return tx.category.name;
  }
  return normalizeMbankCategoryName(tx.mbankCategory) ?? "Bez kategorii";
}
