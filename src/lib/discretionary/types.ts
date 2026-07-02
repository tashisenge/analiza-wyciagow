export interface DiscretionaryPeriodSummary {
  totalPln: number;
  transactionCount: number;
  shareOfExpensesPercent: number | null;
  shareOfIncomePercent: number | null;
  vsPreviousPeriodPercent: number | null;
}

export interface DiscretionaryPersonRow {
  name: string;
  totalPln: number;
  transactionCount: number;
  shareOfDiscretionaryPercent: number | null;
}

export interface DiscretionaryMerchantRow {
  counterparty: string;
  totalPln: number;
  transactionCount: number;
  vsPreviousPeriodPercent: number | null;
}
