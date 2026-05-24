export interface DiscretionaryPeriodSummary {
  totalPln: number;
  transactionCount: number;
  shareOfExpensesPercent: number | null;
  vsPreviousPeriodPercent: number | null;
}

export interface DiscretionaryMerchantRow {
  counterparty: string;
  totalPln: number;
  transactionCount: number;
  vsPreviousPeriodPercent: number | null;
}
