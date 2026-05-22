export interface PeriodSummary {
  totalExpenses: number;
  totalIncome: number;
  net: number;
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return null;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function summarizePeriod(transactions: { amount: string }[]): PeriodSummary {
  let totalExpenses = 0;
  let totalIncome = 0;
  for (const tx of transactions) {
    const value = Number(tx.amount);
    if (value < 0) {
      totalExpenses += Math.abs(value);
    } else if (value > 0) {
      totalIncome += value;
    }
  }
  return {
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    totalIncome: Math.round(totalIncome * 100) / 100,
    net: Math.round((totalIncome - totalExpenses) * 100) / 100,
  };
}
