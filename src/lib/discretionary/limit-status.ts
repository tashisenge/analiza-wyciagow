export const DISCRETIONARY_LIMIT_APPROACHING_PERCENT = 80;

export function isDiscretionaryLimitOverrun(limitUsedPercent: number | null): boolean {
  return limitUsedPercent !== null && limitUsedPercent > 100;
}

export function isDiscretionaryLimitApproaching(
  limitUsedPercent: number | null,
): boolean {
  return (
    limitUsedPercent !== null &&
    limitUsedPercent >= DISCRETIONARY_LIMIT_APPROACHING_PERCENT &&
    limitUsedPercent <= 100
  );
}

export function discretionaryLimitOverrunMessage(
  limitUsedPercent: number,
  monthlyLimit: number,
  totalPln: number,
): string {
  const overBy = Math.max(0, totalPln - monthlyLimit);
  return `Przekroczyliście limit opcjonalnych o ${overBy.toFixed(2)} PLN (${limitUsedPercent.toFixed(1)}% limitu).`;
}

export function discretionaryLimitApproachingMessage(
  limitUsedPercent: number,
  monthlyLimit: number,
  totalPln: number,
): string {
  const remaining = Math.max(0, monthlyLimit - totalPln);
  return `Zbliżacie się do limitu opcjonalnych — zostało ${remaining.toFixed(2)} PLN (${limitUsedPercent.toFixed(1)}% wykorzystane).`;
}
