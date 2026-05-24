import { accountIdsForContext } from "@/lib/analytics/filters";
import { prisma } from "@/lib/db";
import { buildBulkCategoryWhere } from "@/lib/transactions/bulk-category-filter";
import {
  BULK_CATEGORY_MAX,
  type BulkCategoryFilters,
} from "@/lib/transactions/bulk-category-types";

export async function resolveBulkAccountIds(
  workspaceId: string,
  context: BulkCategoryFilters["context"],
): Promise<string[]> {
  const accounts = await prisma.account.findMany({ where: { workspaceId } });
  return accountIdsForContext(accounts, context ?? "razem");
}

interface ResolveTargetIdsInput {
  workspaceId: string;
  accountIds: string[];
  filters: BulkCategoryFilters;
  transactionIds?: string[];
}

export async function resolveBulkTargetIds(input: ResolveTargetIdsInput): Promise<string[]> {
  const where = input.transactionIds?.length
    ? buildBulkCategoryWhere({
        workspaceId: input.workspaceId,
        accountIds: input.accountIds,
        filters: {},
        transactionIds: input.transactionIds,
      })
    : buildBulkCategoryWhere({
        workspaceId: input.workspaceId,
        accountIds: input.accountIds,
        filters: input.filters,
      });

  const rows = await prisma.transaction.findMany({
    where,
    select: { id: true },
    ...(input.transactionIds?.length ? {} : { orderBy: { bookedAt: "desc" as const } }),
    take: BULK_CATEGORY_MAX,
  });
  return rows.map((row) => row.id);
}
