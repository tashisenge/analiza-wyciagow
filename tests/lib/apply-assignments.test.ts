import { beforeEach, describe, expect, it, vi } from "vitest";

const transactionUpdateMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    transaction: {
      updateMany: (...args: unknown[]) => transactionUpdateMany(...args),
    },
  },
}));

import { applyCategoryAssignments } from "@/lib/ai/apply-assignments";

describe("applyCategoryAssignments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transactionUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("clears stale mBank review state when applying an AI category", async () => {
    const updated = await applyCategoryAssignments(
      new Map([["tx-1", "Transport"]]),
      new Map([["Transport", "cat-transport"]]),
      "ws-1",
    );

    expect(updated).toBe(1);
    expect(transactionUpdateMany).toHaveBeenCalledWith({
      where: { id: "tx-1", workspaceId: "ws-1" },
      data: { categoryId: "cat-transport", mbankReviewResolvedAt: null },
    });
  });
});
