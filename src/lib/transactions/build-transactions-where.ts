import type { Prisma } from "@prisma/client";

import {
  prismaCategoryFilter,
  type TransactionSearchParams,
} from "@/lib/transactions/page-filters";
import { transactionListExtraWhere } from "@/lib/transactions/transaction-list-extra-where";

export function buildTransactionsWhere(
  workspaceId: string,
  accountIds: string[],
  params: TransactionSearchParams,
): Prisma.TransactionWhereInput {
  const categoryFilter =
    params.uncategorized === "1" ? {} : prismaCategoryFilter(params, workspaceId);
  return {
    workspaceId,
    accountId: { in: accountIds },
    ...(params.uncategorized === "1" ? { categoryId: null } : {}),
    ...(params.discretionary === "1" ? { category: { isDiscretionary: true } } : {}),
    ...(params.counterparty
      ? {
          counterparty: {
            contains: params.counterparty,
            mode: "insensitive" as const,
          },
        }
      : {}),
    ...transactionListExtraWhere(params),
    ...(params.tagId ? { tags: { some: { tagId: params.tagId } } } : {}),
    ...categoryFilter,
  };
}
