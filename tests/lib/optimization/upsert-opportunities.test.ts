import { describe, expect, it, vi } from "vitest";

import type { DetectedOpportunity } from "@/lib/optimization/types";
import { upsertOpportunities } from "@/lib/optimization/upsert-opportunities";

const recurringOpportunity: DetectedOpportunity = {
  type: "RECURRING",
  title: "Powtarzalne: NETFLIX",
  description: "3 podobne transakcje",
  estimatedMonthlySavings: 49.99,
  counterparty: "NETFLIX",
  categoryId: null,
  evidenceTransactionIds: ["tx-1", "tx-2", "tx-3"],
  dedupeKey: "RECURRING:NETFLIX",
};

function fakePrismaWithLegacy(status: "OPEN" | "DISMISSED") {
  return {
    optimizationOpportunity: {
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue({
        id: "legacy-opportunity",
        status,
      }),
      upsert: vi.fn(),
      update: vi.fn(),
    },
  };
}

describe("upsertOpportunities", () => {
  it("does not recreate locked legacy dedupe rows", async () => {
    const prisma = fakePrismaWithLegacy("DISMISSED");

    const count = await upsertOpportunities({
      prisma: prisma as never,
      workspaceId: "ws-1",
      accountContext: "firma",
      detected: [recurringOpportunity],
      anchor: new Date("2026-03-15"),
    });

    expect(count).toBe(0);
    expect(prisma.optimizationOpportunity.findFirst).toHaveBeenCalledWith({
      where: {
        workspaceId: "ws-1",
        dedupeKey: "RECURRING:NETFLIX:2026-03",
        accountContext: "firma",
      },
      select: { id: true, status: true },
    });
    expect(prisma.optimizationOpportunity.upsert).not.toHaveBeenCalled();
    expect(prisma.optimizationOpportunity.update).not.toHaveBeenCalled();
  });

  it("migrates open legacy dedupe rows to context-scoped keys", async () => {
    const prisma = fakePrismaWithLegacy("OPEN");

    const count = await upsertOpportunities({
      prisma: prisma as never,
      workspaceId: "ws-1",
      accountContext: "firma",
      detected: [recurringOpportunity],
      anchor: new Date("2026-03-15"),
    });

    expect(count).toBe(1);
    expect(prisma.optimizationOpportunity.update).toHaveBeenCalledWith({
      where: { id: "legacy-opportunity" },
      data: expect.objectContaining({
        dedupeKey: "firma:RECURRING:NETFLIX:2026-03",
        evidenceTransactionIds: ["tx-1", "tx-2", "tx-3"],
      }),
    });
    expect(prisma.optimizationOpportunity.upsert).not.toHaveBeenCalled();
  });
});
