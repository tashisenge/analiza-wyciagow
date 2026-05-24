import type { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { applyBulkCategoryUpdate } from "@/lib/transactions/apply-bulk-category";
import {
  resolveBulkAccountIds,
  resolveBulkTargetIds,
} from "@/lib/transactions/bulk-category-targets";
import type { BulkCategoryFilters } from "@/lib/transactions/bulk-category-types";

function revalidateBulkCategoryPaths(): void {
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/categories");
  revalidatePath("/review");
}

interface ExecuteBulkUpdateInput {
  prisma: PrismaClient;
  workspaceId: string;
  categoryId: string;
  rememberMerchant: boolean;
  filters: BulkCategoryFilters;
  transactionIds?: string[];
}

async function resolveBulkUpdateTargetIds(
  input: ExecuteBulkUpdateInput,
): Promise<string[]> {
  const accountIds = await resolveBulkAccountIds(
    input.workspaceId,
    input.filters.context,
  );
  return resolveBulkTargetIds({
    workspaceId: input.workspaceId,
    accountIds,
    filters: input.filters,
    transactionIds: input.transactionIds,
  });
}

export async function executeBulkCategoryUpdate(input: ExecuteBulkUpdateInput): Promise<{
  updatedCount: number;
  rememberedMerchants: number;
}> {
  const targetIds = await resolveBulkUpdateTargetIds(input);

  if (targetIds.length === 0) {
    throw new Error("Brak transakcji spełniających kryteria");
  }

  const result = await applyBulkCategoryUpdate({
    prisma: input.prisma,
    workspaceId: input.workspaceId,
    transactionIds: targetIds,
    categoryId: input.categoryId,
    rememberMerchant: input.rememberMerchant,
  });

  revalidateBulkCategoryPaths();
  return result;
}
