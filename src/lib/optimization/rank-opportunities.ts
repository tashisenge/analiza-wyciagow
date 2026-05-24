import type { DetectedOpportunity } from "@/lib/optimization/types";
import { MAX_OPPORTUNITIES } from "@/lib/optimization/types";

const RECURRING_TYPES = new Set<DetectedOpportunity["type"]>([
  "RECURRING",
  "SUBSCRIPTION",
]);

function sortBySavings(opportunities: DetectedOpportunity[]): DetectedOpportunity[] {
  return [...opportunities].sort((left, right) => {
    const leftSavings = left.estimatedMonthlySavings ?? 0;
    const rightSavings = right.estimatedMonthlySavings ?? 0;
    return rightSavings - leftSavings;
  });
}

export function rankOpportunities(
  opportunities: DetectedOpportunity[],
): DetectedOpportunity[] {
  const recurring = sortBySavings(
    opportunities.filter((item) => RECURRING_TYPES.has(item.type)),
  );
  const otherLimit = Math.max(0, MAX_OPPORTUNITIES - recurring.length);
  const other = sortBySavings(
    opportunities.filter((item) => !RECURRING_TYPES.has(item.type)),
  ).slice(0, otherLimit);
  return [...recurring, ...other];
}
