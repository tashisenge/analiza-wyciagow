export type ContextFilter = "firma" | "dom" | "razem";

export interface AccountForFilter {
  id: string;
  type: string;
}

export function accountIdsForContext(
  accounts: AccountForFilter[],
  context: ContextFilter,
): string[] {
  if (context === "razem") {
    return accounts.map((account) => account.id);
  }
  return accounts
    .filter((account) => account.type === context)
    .map((account) => account.id);
}
