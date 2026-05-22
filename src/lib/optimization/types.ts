import type { AccountContext, OpportunityType } from "@prisma/client";

export interface TxForOptimization {
  id: string;
  bookedAt: Date;
  amount: string;
  counterparty: string;
  categoryId: string | null;
  categoryName: string;
}

export interface DetectedOpportunity {
  type: OpportunityType;
  title: string;
  description: string;
  estimatedMonthlySavings: number | null;
  counterparty: string | null;
  categoryId: string | null;
  evidenceTransactionIds: string[];
  dedupeKey: string;
}

export interface RecurringOptions {
  minOccurrences: number;
  amountTolerancePercent: number;
  windowDays: number;
}

export const DEFAULT_RECURRING_OPTIONS: RecurringOptions = {
  minOccurrences: 3,
  amountTolerancePercent: 5,
  windowDays: 90,
};

export const SPIKE_MIN_INCREASE_PERCENT = 50;
export const SPIKE_MIN_AMOUNT_PLN = 200;
export const ANOMALY_MULTIPLIER = 3;
export const MAX_OPPORTUNITIES = 20;

export type AccountContextValue = AccountContext;
