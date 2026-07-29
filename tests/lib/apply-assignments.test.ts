import { beforeEach, describe, expect, it, vi } from "vitest";

const updateMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    transaction: {
      updateMany: (...args: unknown[]) => updateMany(...args),
    },
  },
}));

import { applyCategoryAssignments } from "@/lib/ai/apply-assignments";

describe("applyCategoryAssignments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateMany.mockResolvedValue({ count: 1 });
  });

  it("guards updates so already-categorized rows are not overwritten", async () => {
    const assignments = new Map([["tx-1", "Żywność"]]);
    const byName = new Map([["Żywność", "cat-food"]]);

    const total = await applyCategoryAssignments(assignments, byName, "ws-1");

    expect(total).toBe(1);
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: "tx-1",
        workspaceId: "ws-1",
        OR: [
          { categoryId: null },
          {
            category: {
              name: { in: ["Bez kategorii", "bez kategorii", "Bez kategorii mBank"] },
            },
          },
        ],
      },
      data: { categoryId: "cat-food" },
    });
  });

  it("skips unknown category names", async () => {
    const assignments = new Map([["tx-1", "Hack"]]);
    const byName = new Map([["Żywność", "cat-food"]]);

    const total = await applyCategoryAssignments(assignments, byName, "ws-1");

    expect(total).toBe(0);
    expect(updateMany).not.toHaveBeenCalled();
  });
});
