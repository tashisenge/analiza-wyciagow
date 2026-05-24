export function isDiscretionaryLimitOverrun(limitUsedPercent: number | null): boolean {
  return limitUsedPercent !== null && limitUsedPercent > 100;
}

export function discretionaryLimitOverrunMessage(
  limitUsedPercent: number,
  monthlyLimit: number,
  totalPln: number,
): string {
  const overBy = Math.max(0, totalPln - monthlyLimit);
  return `Przekroczyliście limit opcjonalnych o ${overBy.toFixed(2)} PLN (${limitUsedPercent.toFixed(1)}% limitu).`;
}
