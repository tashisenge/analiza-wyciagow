import type { PrismaClient } from "@prisma/client";

import { BULK_CATEGORY_MAX, type BulkCategoryApplyResult } from "@/lib/transactions/bulk-category-types";

export interface ApplyBulkCategoryInput {
  prisma: PrismaClient;
  workspaceId: string;
  transactionIds: string[];
  categoryId: string | null;
  rememberMerchant: boolean;
}

export async function applyBulkCategoryUpdate(
  input: ApplyBulkCategoryInput,
): Promise<BulkCategoryApplyResult> {
  const ids = input.transactionIds.slice(0, BULK_CATEGORY_MAX);
  if (ids.length === 0) {
    return { updatedCount: 0, rememberedMerchants: 0 };
  }

  const rows = await input.prisma.transaction.findMany({
    where: { workspaceId: input.workspaceId, id: { in: ids } },
    select: { id: true, counterparty: true },
  });

  const validIds = rows.map((row) => row.id);
  if (validIds.length === 0) {
    return { updatedCount: 0, rememberedMerchants: 0 };
  }

  const { count } = await input.prisma.transaction.updateMany({
    where: { workspaceId: input.workspaceId, id: { in: validIds } },
    data: { categoryId: input.categoryId },
  });

  let rememberedMerchants = 0;
  if (input.categoryId && input.rememberMerchant) {
    const counterparties = new Set<string>();
    for (const row of rows) {
      const key = row.counterparty.trim();
      if (key) {
        counterparties.add(key);
      }
    }
    for (const counterparty of counterparties) {
      await input.prisma.merchantCategoryMemory.upsert({
        where: {
          workspaceId_counterparty: {
            workspaceId: input.workspaceId,
            counterparty,
          },
        },
        create: {
          workspaceId: input.workspaceId,
          counterparty,
          categoryId: input.categoryId,
        },
        update: { categoryId: input.categoryId },
      });
      rememberedMerchants += 1;
    }
  }

  return { updatedCount: count, rememberedMerchants };
}
