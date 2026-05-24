import { TRANSFER_BETWEEN_ACCOUNTS_CATEGORY } from "@/lib/transactions/transfer-category";

/** Kategorie stałych / obowiązkowych wydatków — pomijane w optymalizacji. */
export const FIXED_EXPENSE_CATEGORY_NAMES = [
  TRANSFER_BETWEEN_ACCOUNTS_CATEGORY,
  "Mieszkanie",
  "KUP (firma)",
  "ZUS (firma)",
  "Podatki (firma)",
  "Przychód",
] as const;

export function isFixedExpenseCategoryName(name: string): boolean {
  return (FIXED_EXPENSE_CATEGORY_NAMES as readonly string[]).includes(name);
}
