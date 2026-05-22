import { describe, expect, it } from "vitest";

import { scopedTransactionUpdate } from "@/lib/transactions/scoped-update";

describe("scopedTransactionUpdate", () => {
  it("includes workspaceId and transaction id", () => {
    expect(scopedTransactionUpdate("ws-1", "tx-1", "cat-9")).toEqual({
      where: { id: "tx-1", workspaceId: "ws-1" },
      data: { categoryId: "cat-9" },
    });
  });
});
