import { prisma } from "@/lib/db";
import {
  TRANSFER_BETWEEN_ACCOUNTS_CATEGORY,
  TRANSFER_CATEGORY_COLOR,
} from "@/lib/transactions/transfer-category";

export async function ensureTransferCategory(workspaceId: string): Promise<string> {
  const existing = await prisma.category.findFirst({
    where: { workspaceId, name: TRANSFER_BETWEEN_ACCOUNTS_CATEGORY },
    select: { id: true },
  });
  if (existing) {
    return existing.id;
  }

  const created = await prisma.category.create({
    data: {
      workspaceId,
      name: TRANSFER_BETWEEN_ACCOUNTS_CATEGORY,
      color: TRANSFER_CATEGORY_COLOR,
      isDefault: true,
    },
    select: { id: true },
  });
  return created.id;
}
