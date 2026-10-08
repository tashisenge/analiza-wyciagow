import type { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";

import type { TxForOptimization } from "@/lib/optimization/types";
import { verifyImplementedSavings } from "@/lib/optimization/upsert-opportunities";

interface PendingOpportunity {
  id: string;
  counterparty: string | null;
  accountContext: "firma" | "dom" | "razem";
}

function netflixTx(id: string, amount: string): TxForOptimization {
  return {
    id,
    bookedAt: new Date(),
    amount,
    counterparty: "NETFLIX",
    categoryId: null,
    categoryName: "",
  };
}

function fakePrisma(opportunities: PendingOpportunity[]): {
  prisma: PrismaClient;
  updatedIds: string[];
} {
  const updatedIds: string[] = [];
  const prisma = {
    optimizationOpportunity: {
      findMany: (args: {
        where: { accountContext?: PendingOpportunity["accountContext"] };
      }) => {
        const context = args.where.accountContext;
        return context
          ? opportunities.filter((item) => item.accountContext === context)
          : opportunities;
      },
      update: (args: { where: { id: string } }) => {
        updatedIds.push(args.where.id);
        return { id: args.where.id };
      },
    },
  } as unknown as PrismaClient;
  return { prisma, updatedIds };
}

const pending = [
  { id: "dom-netflix", counterparty: "NETFLIX", accountContext: "dom" as const },
  { id: "firma-netflix", counterparty: "NETFLIX", accountContext: "firma" as const },
];

describe("verifyImplementedSavings", () => {
  it("verifies only implemented opportunities from the refreshed account context", async () => {
    const { prisma, updatedIds } = fakePrisma(pending);

    const verified = await verifyImplementedSavings({
      prisma,
      workspaceId: "ws-1",
      accountContext: "firma",
      beforeTxs: [netflixTx("before", "-100")],
      afterTxs: [],
    });

    expect(verified).toBe(1);
    expect(updatedIds).toEqual(["firma-netflix"]);
  });

  it("does not mark savings verified when spend in the measured context stayed flat", async () => {
    const { prisma, updatedIds } = fakePrisma(pending);

    const verified = await verifyImplementedSavings({
      prisma,
      workspaceId: "ws-1",
      accountContext: "firma",
      beforeTxs: [netflixTx("before", "-100")],
      afterTxs: [netflixTx("after", "-100")],
    });

    expect(verified).toBe(0);
    expect(updatedIds).toEqual([]);
  });
});
