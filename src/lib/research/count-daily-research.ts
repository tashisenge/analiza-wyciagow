import type { PrismaClient } from "@prisma/client";

import { RESEARCH_DAILY_LIMIT } from "@/lib/research/types";

function startOfUtcDay(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function countDailyResearch(
  prisma: PrismaClient,
  workspaceId: string,
  now = new Date(),
): Promise<number> {
  return prisma.opportunityResearch.count({
    where: {
      workspaceId,
      researchedAt: { gte: startOfUtcDay(now) },
    },
  });
}

export function isDailyLimitReached(count: number): boolean {
  return count >= RESEARCH_DAILY_LIMIT;
}
