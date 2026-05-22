import type { PrismaClient } from "@prisma/client";

export interface UpsertCounterpartyRuleOptions {
  prisma: PrismaClient;
  workspaceId: string;
  categoryId: string;
  counterparty: string;
}

async function hasCounterpartyCategoryRule(
  options: UpsertCounterpartyRuleOptions,
  matchContains: string,
): Promise<boolean> {
  const existing = await options.prisma.categoryRule.findFirst({
    where: {
      workspaceId: options.workspaceId,
      matchField: "counterparty",
      matchContains: { equals: matchContains, mode: "insensitive" },
      categoryId: options.categoryId,
    },
  });
  return existing !== null;
}

export async function upsertCounterpartyRule(
  options: UpsertCounterpartyRuleOptions,
): Promise<void> {
  const matchContains = options.counterparty.trim();
  if (!matchContains) {
    return;
  }

  if (await hasCounterpartyCategoryRule(options, matchContains)) {
    return;
  }

  await options.prisma.categoryRule.create({
    data: {
      workspaceId: options.workspaceId,
      categoryId: options.categoryId,
      matchField: "counterparty",
      matchContains,
      priority: 10,
    },
  });
}
