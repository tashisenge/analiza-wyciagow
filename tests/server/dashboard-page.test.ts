import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const loadDashboardPageContext = vi.fn();
const hasReviewQueueItems = vi.fn();
const countReviewQueue = vi.fn();

vi.stubGlobal("React", React);

vi.mock("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement("a", null, children),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("@/components/dashboard/AiPanel", () => ({ AiPanel: vi.fn(() => null) }));
vi.mock("@/components/dashboard/CategoryBreakdownPanel", () => ({
  CategoryBreakdownPanel: vi.fn(() => null),
}));
vi.mock("@/components/dashboard/CategoryChart", () => ({
  DashboardCategorySection: vi.fn(() => null),
}));
vi.mock("@/components/dashboard/ContextToggle", () => ({
  ContextToggle: vi.fn(() => null),
}));
vi.mock("@/components/dashboard/DateRangeToggle", () => ({
  DateRangeToggle: vi.fn(() => null),
}));
vi.mock("@/components/dashboard/DiscretionaryWidget", () => ({
  DiscretionaryWidget: vi.fn(() => null),
}));
vi.mock("@/components/dashboard/MerchantChart", () => ({
  MerchantChart: vi.fn(() => null),
}));
vi.mock("@/components/dashboard/MerchantList", () => ({
  MerchantList: vi.fn(() => null),
}));
vi.mock("@/components/dashboard/MonthlyTrendChart", () => ({
  MonthlyTrendChart: vi.fn(() => null),
  YearlySummaryCards: vi.fn(() => null),
}));
vi.mock("@/components/dashboard/OptimizeWidget", () => ({
  OptimizeWidget: vi.fn(() => null),
}));
vi.mock("@/components/dashboard/PeriodPicker", () => ({
  MonthPicker: vi.fn(() => null),
  YearPicker: vi.fn(() => null),
}));
vi.mock("@/components/dashboard/PeriodSummary", () => ({
  PeriodSummaryCards: vi.fn(() => null),
}));
vi.mock("@/components/dashboard/RecurringWidgets", () => ({
  RecurringPaymentsWidget: vi.fn(() => null),
  SubscriptionsWidget: vi.fn(() => null),
}));
vi.mock("@/components/ui/PageHeader", () => ({ PageHeader: vi.fn(() => null) }));

vi.mock("@/lib/analytics/load-dashboard-page", () => ({
  loadDashboardPageContext: (...args: unknown[]) => loadDashboardPageContext(...args),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { workspaceId: "ws-1" } }),
}));

vi.mock("@/lib/review/load-review-queue", () => ({
  countReviewQueue: (...args: unknown[]) => countReviewQueue(...args),
  hasReviewQueueItems: (...args: unknown[]) => hasReviewQueueItems(...args),
}));

import DashboardPage from "@/app/(app)/dashboard/page";

function makeDashboardPageContext(): Record<string, unknown> {
  return {
    context: "all",
    period: "month",
    year: 2026,
    month: 6,
    range: { isFullYear: false, label: "czerwiec 2026" },
    data: {
      summary: {},
      previousSummary: {},
      slices: [],
      merchants: [],
      categoryGroups: [],
      discretionarySummary: {},
      discretionaryMonthlyLimit: null,
      discretionaryLimitUsedPercent: 0,
      hasDiscretionaryCategories: false,
      yearlyMonths: [],
      monthlyTrend: [],
      recurringPayments: [],
      markedSubscriptions: [],
      topOpportunities: [],
      budgetOverrunCount: 0,
      uncategorized: 0,
      categorizedPercent: 100,
      aiTargetCount: 0,
    },
    aiStatus: {
      available: false,
      preference: null,
      activeProvider: null,
      availableProviders: [],
    },
    insightHistory: [],
    excludedCategoryCount: 0,
  };
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadDashboardPageContext.mockResolvedValue(makeDashboardPageContext());
    hasReviewQueueItems.mockResolvedValue(true);
    countReviewQueue.mockResolvedValue(999);
  });

  it("uses a bounded review presence check while rendering", async () => {
    await DashboardPage({ searchParams: Promise.resolve({}) });

    expect(hasReviewQueueItems).toHaveBeenCalledWith("ws-1");
    expect(countReviewQueue).not.toHaveBeenCalled();
  });
});
