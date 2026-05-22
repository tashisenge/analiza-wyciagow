export function normalizeAmountForMatch(amount: string | { toString(): string }): string {
  const value = Math.abs(Number(amount.toString()));
  if (!Number.isFinite(value)) {
    return "0.00";
  }
  return value.toFixed(2);
}
