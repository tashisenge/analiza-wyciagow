import { describe, expect, it } from "vitest";

import { medianByCategory } from "@/lib/analytics/category-median";
import { monthlyExpenseTrend } from "@/lib/analytics/monthly-trend";
import { buildOpportunities } from "@/lib/optimization/build-opportunities";
import { detectBudgetOverruns } from "@/lib/optimization/detect-budget-overruns";
import { detectMerchantSpikes } from "@/lib/optimization/detect-merchant-spikes";
import { detectSubscriptionsFromDates } from "@/lib/optimization/detect-subscriptions";
import { sixMonthsAgo } from "@/lib/optimization/fetch-optimization-inputs";
import { mapTransactionsForOptimization } from "@/lib/optimization/map-transactions";
import {
  buildDedupeKey,
  monthKeyFromDate,
} from "@/lib/optimization/opportunity-dedupe-key";
import { rankOpportunities } from "@/lib/optimization/rank-opportunities";
import type { DetectedOpportunity } from "@/lib/optimization/types";

const baseTx = {
  id: "1",
  bookedAt: new Date("2026-03-01"),
  amount: "-100",
  counterparty: "SHOP",
  categoryId: "c1",
  categoryName: "Jedzenie",
};

describe("optimization helpers", () => {
  it("maps transactions for optimization", () => {
    const mapped = mapTransactionsForOptimization([
      {
        id: "x",
        bookedAt: new Date(),
        amount: { toString: () => "-10" },
        counterparty: "A",
        categoryId: null,
        category: null,
        mbankCategory: "Bez kategorii",
      },
    ]);
    expect(mapped[0]?.categoryName).toBe("Bez kategorii");
  });

  it("builds dedupe key with month", () => {
    const item: DetectedOpportunity = {
      type: "RECURRING",
      title: "t",
      description: "d",
      estimatedMonthlySavings: 10,
      counterparty: "X",
      categoryId: null,
      evidenceTransactionIds: [],
      dedupeKey: "RECURRING:X",
    };
    expect(buildDedupeKey(item, "2026-03")).toBe("RECURRING:X:2026-03");
    expect(monthKeyFromDate(new Date("2026-03-15"))).toBe("2026-03");
  });

  it("ranks and caps opportunities", () => {
    const ranked = rankOpportunities([
      {
        ...baseTx,
        type: "ANOMALY",
        title: "a",
        description: "",
        estimatedMonthlySavings: 5,
        counterparty: null,
        evidenceTransactionIds: [],
        dedupeKey: "a",
      },
      {
        ...baseTx,
        type: "ANOMALY",
        title: "b",
        description: "",
        estimatedMonthlySavings: 50,
        counterparty: null,
        evidenceTransactionIds: [],
        dedupeKey: "b",
      },
    ] as DetectedOpportunity[]);
    expect(ranked[0]?.estimatedMonthlySavings).toBe(50);
  });

  it("detects budget overrun", () => {
    const found = detectBudgetOverruns(
      [{ ...baseTx, amount: "-500" }],
      [
        {
          categoryId: "c1",
          monthlyLimit: { toString: () => "300" },
          categoryName: "Jedzenie",
        },
      ],
    );
    expect(found[0]?.type).toBe("BUDGET_OVERRUN");
  });

  it("detects subscriptions from keyword", () => {
    const recurring: DetectedOpportunity[] = [
      {
        type: "RECURRING",
        title: "Powtarzalne: NETFLIX",
        description: "d",
        estimatedMonthlySavings: 50,
        counterparty: "NETFLIX",
        categoryId: null,
        evidenceTransactionIds: ["1"],
        dedupeKey: "RECURRING:NETFLIX",
      },
    ];
    const subs = detectSubscriptionsFromDates(recurring, new Map([["1", new Date()]]));
    expect(subs[0]?.type).toBe("SUBSCRIPTION");
  });

  it("computes six months ago", () => {
    const anchor = new Date("2026-05-15");
    expect(sixMonthsAgo(anchor).getMonth()).toBe(10);
  });

  it("computes category median", () => {
    const medians = medianByCategory([
      { categoryId: "c1", amount: "-10" },
      { categoryId: "c1", amount: "-30" },
    ]);
    expect(medians.get("c1")).toBe(20);
  });

  it("runs detection for month with empty budgets", () => {
    const anchor = new Date();
    const txs = [0, 1, 2].map((offset) => ({
      ...baseTx,
      id: String(offset),
      counterparty: "NETFLIX",
      amount: "-49.99",
      bookedAt: new Date(anchor.getFullYear(), anchor.getMonth() - offset, 5),
    }));
    const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const detected = buildOpportunities({
      current: txs.filter((tx) => tx.bookedAt >= monthStart),
      history: txs.filter((tx) => tx.bookedAt < monthStart),
      budgets: [],
      anchor,
    });
    expect(detected.length).toBeGreaterThan(0);
  });

  it("detects merchant spike with strong growth", () => {
    const previous = Array.from({ length: 3 }, (_, i) => ({
      ...baseTx,
      id: `p${String(i)}`,
      counterparty: "LIDL",
      amount: "-100",
      bookedAt: new Date("2026-01-01"),
    }));
    const current = [
      ...previous,
      {
        ...baseTx,
        id: "c1",
        counterparty: "LIDL",
        amount: "-400",
        bookedAt: new Date("2026-02-01"),
      },
    ];
    const found = detectMerchantSpikes(current, previous);
    expect(found.some((item) => item.type === "MERCHANT_SPIKE")).toBe(true);
  });

  it("builds monthly trend with gaps", () => {
    const trend = monthlyExpenseTrend([], new Date("2026-05-01"), 3);
    expect(trend).toHaveLength(3);
    expect(trend.every((point) => point.total === 0)).toBe(true);
  });
});
