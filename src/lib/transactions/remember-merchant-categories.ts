import type { PrismaClient } from "@prisma/client";

interface RememberCounterpartiesInput {
  prisma: PrismaClient;
  workspaceId: string;
  rows: { counterparty: string }[];
  categoryId: string;
}

async function rememberUniqueCounterparties(
  input: RememberCounterpartiesInput,
): Promise<number> {
  const counterparties = new Set<string>();
  for (const row of input.rows) {
    const key = row.counterparty.trim();
    if (key) {
      counterparties.add(key);
    }
  }

  for (const counterparty of counterparties) {
    await input.prisma.merchantCategoryMemory.upsert({
      where: {
        workspaceId_counterparty: { workspaceId: input.workspaceId, counterparty },
      },
      create: {
        workspaceId: input.workspaceId,
        counterparty,
        categoryId: input.categoryId,
      },
      update: { categoryId: input.categoryId },
    });
  }

  return counterparties.size;
}

export { rememberUniqueCounterparties };
