import { describe, expect, it } from "vitest";

import { rankDiscretionaryMerchants } from "@/lib/discretionary/compute-discretionary-merchants";

describe("rankDiscretionaryMerchants", () => {
  it("ranks by spend desc and computes m/m change", () => {
    const rows = rankDiscretionaryMerchants(
      [
        { counterparty: "NETFLIX", currentPln: 50, previousPln: 40, count: 1 },
        { counterparty: "UBER", currentPln: 120, previousPln: 100, count: 4 },
      ],
      5,
    );
    expect(rows[0]?.counterparty).toBe("UBER");
    expect(rows[0]?.totalPln).toBe(120);
    expect(rows[0]?.vsPreviousPeriodPercent).toBe(20);
  });
});
