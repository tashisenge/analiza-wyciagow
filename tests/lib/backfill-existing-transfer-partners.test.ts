import { describe, expect, it } from "vitest";

import { buildTransferPartnerBackfillUpdate } from "@/lib/import/backfill-existing-transfer-partners";

describe("buildTransferPartnerBackfillUpdate", () => {
  it("returns null when there are no partner hashes", () => {
    expect(
      buildTransferPartnerBackfillUpdate({
        workspaceId: "ws-1",
        transferCategoryId: "cat-transfer",
        existingPartnerHashes: new Set(),
      }),
    ).toBeNull();
  });

  it("returns null when transfer category is missing", () => {
    expect(
      buildTransferPartnerBackfillUpdate({
        workspaceId: "ws-1",
        transferCategoryId: null,
        existingPartnerHashes: new Set(["hash-a"]),
      }),
    ).toBeNull();
  });

  it("scopes partner category backfill to workspace and hashes", () => {
    const update = buildTransferPartnerBackfillUpdate({
      workspaceId: "ws-1",
      transferCategoryId: "cat-transfer",
      existingPartnerHashes: new Set(["dom-in-first-import", "other"]),
    });

    expect(update).not.toBeNull();
    expect(update?.data).toEqual({ categoryId: "cat-transfer" });
    expect(update?.where.workspaceId).toBe("ws-1");
    expect(update?.where.NOT).toEqual({ categoryId: "cat-transfer" });
    expect(update?.where.dedupeHash.in.sort()).toEqual(["dom-in-first-import", "other"]);
  });
});
