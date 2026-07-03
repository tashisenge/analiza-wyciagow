export interface ImplementedOpportunityRow {
  savingsVerified: boolean;
  estimatedMonthlySavings: { toString(): string } | null;
}

export interface SavingsImpactSummary {
  totalImplemented: number;
  verifiedCount: number;
  verifiedMonthlySavingsPln: number;
  pendingVerificationCount: number;
}

export function aggregateSavingsImpact(
  opportunities: ImplementedOpportunityRow[],
): SavingsImpactSummary {
  let verifiedMonthlySavingsPln = 0;
  let verifiedCount = 0;

  for (const item of opportunities) {
    if (!item.savingsVerified) {
      continue;
    }
    verifiedCount += 1;
    if (item.estimatedMonthlySavings) {
      verifiedMonthlySavingsPln += Number(item.estimatedMonthlySavings);
    }
  }

  return {
    totalImplemented: opportunities.length,
    verifiedCount,
    verifiedMonthlySavingsPln: Math.round(verifiedMonthlySavingsPln * 100) / 100,
    pendingVerificationCount: opportunities.length - verifiedCount,
  };
}
