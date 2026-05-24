import type { PrismaClient } from "@prisma/client";

import { applyCategoryToTransactionRows } from "@/lib/transactions/apply-category-to-rows";
import { BULK_CATEGORY_MAX } from "@/lib/transactions/bulk-category-types";

async function loadValidRows(
  prisma: PrismaClient,
  workspaceId: string,
  ids: string[],
): Promise<{ id: string; counterparty: string }[]> {
  return prisma.transaction.findMany({
    where: { workspaceId, id: { in: ids } },
    select: { id: true, counterparty: true },
  });
}

export async function applyBulkCategoryUpdate(input: {
  prisma: PrismaClient;
  workspaceId: string;
  transactionIds: string[];
  categoryId: string | null;
  rememberMerchant: boolean;
}): Promise<{ updatedCount: number; rememberedMerchants: number }> {
  const ids = input.transactionIds.slice(0, BULK_CATEGORY_MAX);
  const rows = ids.length > 0 ? await loadValidRows(input.prisma, input.workspaceId, ids) : [];
  if (rows.length === 0) {
    return { updatedCount: 0, rememberedMerchants: 0 };
  }
  return applyCategoryToTransactionRows({
    prisma: input.prisma,
    workspaceId: input.workspaceId,
    rows,
    categoryId: input.categoryId,
    rememberMerchant: input.rememberMerchant,
  });
}
