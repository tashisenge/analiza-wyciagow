import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  findSimilarTransactionIds,
  type FindSimilarTransactionIdsOptions,
} from "@/lib/transactions/find-similar-transaction-ids";

type PaginatedSimilarityOptions = FindSimilarTransactionIdsOptions & {
  candidateTransactionIds: string[];
};

function options(
  findMany: ReturnType<typeof vi.fn>,
  candidateTransactionIds: string[],
): PaginatedSimilarityOptions {
  return {
    prisma: {
      transaction: { findMany },
    } as unknown as PrismaClient,
    workspaceId: "ws-1",
    counterparty: "LIDL",
    excludeTransactionId: "tx-anchor",
    onlyUncategorized: false,
    candidateTransactionIds,
  };
}

describe("findSimilarTransactionIds", () => {
  it("restricts matches to candidate transactions from the visible page", async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: "tx-visible" }]);

    await findSimilarTransactionIds(
      options(findMany, ["tx-anchor", "tx-visible"]),
    );

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: {
            in: ["tx-anchor", "tx-visible"],
            not: "tx-anchor",
          },
        }),
      }),
    );
  });

  it("does not fall back to workspace-wide matches without candidates", async () => {
    const findMany = vi.fn().mockResolvedValue([]);

    const result = await findSimilarTransactionIds(options(findMany, []));

    expect(result).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });
});
