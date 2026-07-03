import { describe, expect, it } from "vitest";

import {
  buildSavingsRitualSteps,
  savingsRitualCoreComplete,
  SAVINGS_RITUAL_COVERAGE_PERCENT,
} from "@/lib/analytics/savings-ritual-state";

const links = {
  importHref: "/import",
  transactionsHref: "/transactions?uncategorized=1",
  opcjonalneHref: "/opcjonalne",
};

describe("buildSavingsRitualSteps", () => {
  it("marks core steps done when data is healthy", () => {
    const steps = buildSavingsRitualSteps(
      {
        hasImport: true,
        isStaleImport: false,
        categorizedPercent: 90,
        monthlyLimit: 1000,
        limitUsedPercent: 50,
      },
      links,
    );
    expect(steps.find((step) => step.id === "import")?.done).toBe(true);
    expect(steps.find((step) => step.id === "coverage")?.done).toBe(true);
    expect(steps.find((step) => step.id === "limit")?.done).toBe(true);
    expect(steps.find((step) => step.id === "aiReport")?.optional).toBe(true);
    expect(savingsRitualCoreComplete(steps)).toBe(true);
  });

  it("flags stale import and low coverage", () => {
    const steps = buildSavingsRitualSteps(
      {
        hasImport: true,
        isStaleImport: true,
        categorizedPercent: 60,
        monthlyLimit: null,
        limitUsedPercent: null,
      },
      links,
    );
    expect(steps.find((step) => step.id === "import")?.done).toBe(false);
    expect(steps.find((step) => step.id === "coverage")?.done).toBe(false);
    expect(steps.find((step) => step.id === "coverage")?.label).toContain(
      String(SAVINGS_RITUAL_COVERAGE_PERCENT),
    );
    expect(savingsRitualCoreComplete(steps)).toBe(false);
  });

  it("flags limit when approaching threshold", () => {
    const steps = buildSavingsRitualSteps(
      {
        hasImport: true,
        isStaleImport: false,
        categorizedPercent: 95,
        monthlyLimit: 1000,
        limitUsedPercent: 85,
      },
      links,
    );
    expect(steps.find((step) => step.id === "limit")?.done).toBe(false);
  });
});
