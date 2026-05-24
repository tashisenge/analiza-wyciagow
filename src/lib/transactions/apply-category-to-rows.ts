import type { PrismaClient } from "@prisma/client";

import { rememberUniqueCounterparties } from "@/lib/transactions/remember-merchant-categories";

async function rememberIfRequested(input: {
  prisma: PrismaClient;
  workspaceId: string;
  rows: { counterparty: string }[];
  categoryId: string | null;
  rememberMerchant: boolean;
}): Promise<number> {
  if (!input.categoryId || !input.rememberMerchant) {
    return 0;
  }
  return rememberUniqueCounterparties({
    prisma: input.prisma,
    workspaceId: input.workspaceId,
    rows: input.rows,
    categoryId: input.categoryId,
  });
}

export async function applyCategoryToTransactionRows(input: {
  prisma: PrismaClient;
  workspaceId: string;
  rows: { id: string; counterparty: string }[];
  categoryId: string | null;
  rememberMerchant: boolean;
}): Promise<{ updatedCount: number; rememberedMerchants: number }> {
  const { count } = await input.prisma.transaction.updateMany({
    where: { workspaceId: input.workspaceId, id: { in: input.rows.map((row) => row.id) } },
    data: { categoryId: input.categoryId },
  });
  const rememberedMerchants = await rememberIfRequested({
    prisma: input.prisma,
    workspaceId: input.workspaceId,
    rows: input.rows,
    categoryId: input.categoryId,
    rememberMerchant: input.rememberMerchant,
  });
  return { updatedCount: count, rememberedMerchants };
}
