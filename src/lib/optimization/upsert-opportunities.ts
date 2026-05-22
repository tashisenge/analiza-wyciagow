import type { OpportunityStatus, PrismaClient } from "@prisma/client";

import { measureSavingsImpact } from "@/lib/optimization/measure-savings-impact";
import {
  buildDedupeKey,
  monthKeyFromDate,
} from "@/lib/optimization/opportunity-dedupe-key";
import {
  opportunityCreateData,
  opportunityUpdateData,
} from "@/lib/optimization/opportunity-upsert-data";
import type { DetectedOpportunity, TxForOptimization } from "@/lib/optimization/types";

const LOCKED_STATUSES: OpportunityStatus[] = ["IMPLEMENTED", "DISMISSED"];

interface UpsertOneOptions {
  prisma: PrismaClient;
  workspaceId: string;
  accountContext: "firma" | "dom" | "razem";
  item: DetectedOpportunity;
  dedupeKey: string;
}

async function upsertOne(options: UpsertOneOptions): Promise<boolean> {
  const { prisma, workspaceId, accountContext, item, dedupeKey } = options;
  const existing = await prisma.optimizationOpportunity.findUnique({
    where: { workspaceId_dedupeKey: { workspaceId, dedupeKey } },
  });
  if (existing && LOCKED_STATUSES.includes(existing.status)) {
    return false;
  }

  await prisma.optimizationOpportunity.upsert({
    where: { workspaceId_dedupeKey: { workspaceId, dedupeKey } },
    create: opportunityCreateData({ workspaceId, accountContext, item, dedupeKey }),
    update: opportunityUpdateData(item),
  });
  return true;
}

export interface UpsertOpportunitiesOptions {
  prisma: PrismaClient;
  workspaceId: string;
  accountContext: "firma" | "dom" | "razem";
  detected: DetectedOpportunity[];
  anchor?: Date;
}

export async function upsertOpportunities(
  options: UpsertOpportunitiesOptions,
): Promise<number> {
  const anchor = options.anchor ?? new Date();
  const monthKey = monthKeyFromDate(anchor);
  let count = 0;

  for (const item of options.detected) {
    const dedupeKey = buildDedupeKey(item, monthKey);
    const saved = await upsertOne({
      prisma: options.prisma,
      workspaceId: options.workspaceId,
      accountContext: options.accountContext,
      item,
      dedupeKey,
    });
    if (saved) {
      count += 1;
    }
  }
  return count;
}

export interface VerifySavingsOptions {
  prisma: PrismaClient;
  workspaceId: string;
  beforeTxs: TxForOptimization[];
  afterTxs: TxForOptimization[];
}

async function fetchPendingVerification(
  prisma: PrismaClient,
  workspaceId: string,
): Promise<{ id: string; counterparty: string | null }[]> {
  return prisma.optimizationOpportunity.findMany({
    where: {
      workspaceId,
      status: "IMPLEMENTED",
      savingsVerified: false,
      counterparty: { not: null },
      resolvedAt: { lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
  });
}

export async function verifyImplementedSavings(
  options: VerifySavingsOptions,
): Promise<number> {
  const implemented = await fetchPendingVerification(options.prisma, options.workspaceId);
  let verified = 0;
  for (const opp of implemented) {
    if (!opp.counterparty) {
      continue;
    }
    const works = measureSavingsImpact(
      opp.counterparty,
      options.beforeTxs,
      options.afterTxs,
    );
    if (!works) {
      continue;
    }
    await options.prisma.optimizationOpportunity.update({
      where: { id: opp.id },
      data: { savingsVerified: true },
    });
    verified += 1;
  }
  return verified;
}
