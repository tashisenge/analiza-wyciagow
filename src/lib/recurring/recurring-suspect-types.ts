import type { OpportunityStatus, OpportunityType } from "@prisma/client";

export type RecurringStatusFilter = "open" | "accepted" | "dismissed" | "all";

export interface RecurringEvidenceTx {
  id: string;
  bookedAt: string;
  amount: string;
  description: string;
}

export interface RecurringSuspectRow {
  id: string;
  type: OpportunityType;
  status: OpportunityStatus;
  title: string;
  description: string;
  counterparty: string | null;
  categoryName: string | null;
  estimatedMonthlySavings: number | null;
  evidenceTransactions: RecurringEvidenceTx[];
  isMarkedSubscription: boolean;
  detectedAt: string;
}
