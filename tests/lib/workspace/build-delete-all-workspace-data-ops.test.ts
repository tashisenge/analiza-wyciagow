import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  runDeleteAllWorkspaceData,
  WORKSPACE_WIPE_DELETED_MODELS,
  WORKSPACE_WIPE_PRESERVED_MODELS,
} from "@/lib/workspace/build-delete-all-workspace-data-ops";

describe("runDeleteAllWorkspaceData", () => {
  const transactionDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
  const importBatchDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
  const opportunityDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
  const subscriptionMarkerDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
  const aiInsightDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
  const workspaceUpdate = vi.fn().mockResolvedValue({ id: "ws-1" });
  const categoryRuleDeleteMany = vi.fn();
  const merchantMemoryDeleteMany = vi.fn();
  const $transaction = vi.fn(async (ops: unknown[]) => {
    await Promise.all(ops as Promise<unknown>[]);
  });

  const db = {
    $transaction,
    transaction: { deleteMany: transactionDeleteMany },
    importBatch: { deleteMany: importBatchDeleteMany },
    optimizationOpportunity: { deleteMany: opportunityDeleteMany },
    subscriptionMarker: { deleteMany: subscriptionMarkerDeleteMany },
    aiInsight: { deleteMany: aiInsightDeleteMany },
    workspace: { update: workspaceUpdate },
    categoryRule: { deleteMany: categoryRuleDeleteMany },
    merchantCategoryMemory: { deleteMany: merchantMemoryDeleteMany },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("wipes ledger and derived analysis for the workspace", async () => {
    await runDeleteAllWorkspaceData(db as never, "ws-1");

    expect($transaction).toHaveBeenCalledTimes(1);
    expect(transactionDeleteMany).toHaveBeenCalledWith({
      where: { workspaceId: "ws-1" },
    });
    expect(importBatchDeleteMany).toHaveBeenCalledWith({
      where: { workspaceId: "ws-1" },
    });
    expect(opportunityDeleteMany).toHaveBeenCalledWith({
      where: { workspaceId: "ws-1" },
    });
    expect(subscriptionMarkerDeleteMany).toHaveBeenCalledWith({
      where: { workspaceId: "ws-1" },
    });
    expect(aiInsightDeleteMany).toHaveBeenCalledWith({ where: { workspaceId: "ws-1" } });
    expect(workspaceUpdate).toHaveBeenCalledWith({
      where: { id: "ws-1" },
      data: { lastAiInsight: null, lastAiInsightAt: null },
    });
  });

  it("does not delete categorization rules or merchant memory", async () => {
    await runDeleteAllWorkspaceData(db as never, "ws-1");

    expect(categoryRuleDeleteMany).not.toHaveBeenCalled();
    expect(merchantMemoryDeleteMany).not.toHaveBeenCalled();
  });

  it("keeps deleted and preserved model lists disjoint", () => {
    const deleted = new Set<string>(WORKSPACE_WIPE_DELETED_MODELS);
    for (const model of WORKSPACE_WIPE_PRESERVED_MODELS) {
      expect(deleted.has(model)).toBe(false);
    }
    expect(WORKSPACE_WIPE_PRESERVED_MODELS).toContain("categoryRule");
    expect(WORKSPACE_WIPE_PRESERVED_MODELS).toContain("merchantCategoryMemory");
    expect(WORKSPACE_WIPE_DELETED_MODELS).toContain("optimizationOpportunity");
    expect(WORKSPACE_WIPE_DELETED_MODELS).toContain("subscriptionMarker");
  });
});
