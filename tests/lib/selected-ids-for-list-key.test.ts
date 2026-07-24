import { describe, expect, it } from "vitest";

import { selectedIdsForListKey } from "@/lib/transactions/selected-ids-for-list-key";

describe("selectedIdsForListKey", () => {
  it("keeps selection when the list identity is unchanged", () => {
    expect(
      selectedIdsForListKey(
        ["tx-a", "tx-b"],
        "/transactions?cursor=abc",
        "/transactions?cursor=abc",
      ),
    ).toEqual(["tx-a", "tx-b"]);
  });

  it("clears selection when pagination cursor changes", () => {
    expect(
      selectedIdsForListKey(
        ["tx-page-1"],
        "/transactions",
        "/transactions?cursor=eyJvZmYiOjUwfQ",
      ),
    ).toEqual([]);
  });

  it("clears selection when filters or sort change", () => {
    expect(
      selectedIdsForListKey(
        ["tx-old-filter"],
        "/transactions?counterparty=Biedronka",
        "/transactions?counterparty=Lidl",
      ),
    ).toEqual([]);
  });

  it("does not clear on first mount when there is no previous list key", () => {
    expect(selectedIdsForListKey(["tx-a"], null, "/transactions")).toEqual(["tx-a"]);
  });
});
