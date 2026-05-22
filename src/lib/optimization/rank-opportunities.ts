import type { DetectedOpportunity } from "@/lib/optimization/types";
import { MAX_OPPORTUNITIES } from "@/lib/optimization/types";

export function rankOpportunities(
  opportunities: DetectedOpportunity[],
): DetectedOpportunity[] {
  return [...opportunities]
    .sort((left, right) => {
      const leftSavings = left.estimatedMonthlySavings ?? 0;
      const rightSavings = right.estimatedMonthlySavings ?? 0;
      return rightSavings - leftSavings;
    })
    .slice(0, MAX_OPPORTUNITIES);
}
