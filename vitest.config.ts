import path from "path";

import { defineConfig } from "vitest/config";

/** Pliki graniczne (Prisma, API, orchestracja) — testowane integracyjnie / E2E, nie w progach unit. */
const COVERAGE_EXCLUDE = [
  "src/lib/**/*.d.ts",
  "src/lib/auth.ts",
  "src/lib/auth.config.ts",
  "src/lib/seed-default-categories.ts",
  "src/lib/ai/complete.ts",
  "src/lib/ai/config.ts",
  "src/lib/ai/generate-insights.ts",
  "src/lib/ai/load-insight-transactions.ts",
  "src/lib/ai/build-insight-payload.ts",
  "src/lib/ai/save-ai-insight.ts",
  "src/lib/ai/load-ai-insight-history.ts",
  "src/lib/ai/resolve-workspace-ai.ts",
  "src/lib/ai/run-generate-insight.ts",
  "src/lib/ai/describe-ai-categorization.ts",
  "src/lib/ai/run-categorization.ts",
  "src/lib/ai/ai-target-transactions.ts",
  "src/lib/ai/status.ts",
  "src/lib/ai/apply-assignments.ts",
  "src/lib/analytics/load-dashboard.ts",
  "src/lib/analytics/fetch-dashboard-opportunities.ts",
  "src/lib/research/run-opportunity-research.ts",
  "src/lib/research/search-tavily.ts",
  "src/lib/research/config.ts",
  "src/lib/research/count-daily-research.ts",
  "src/lib/research/map-research-view.ts",
  "src/lib/research/opportunity-research-props.ts",
  "src/lib/optimization/map-opportunity-cards.ts",
  "src/lib/optimization/load-optimization-data.ts",
  "src/lib/optimization/load-budget-spent.ts",
  "src/lib/optimization/upsert-opportunities.ts",
  "src/lib/optimization/opportunity-upsert-data.ts",
  "src/lib/optimization/run-detection.ts",
  "src/lib/transactions/load-workspace-transfer-pairs.ts",
  "src/lib/transactions/build-transaction-table-rows.ts",
  "src/lib/transactions/find-similar-transaction-ids.ts",
];

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/lib/**/*.ts"],
      exclude: COVERAGE_EXCLUDE,
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
