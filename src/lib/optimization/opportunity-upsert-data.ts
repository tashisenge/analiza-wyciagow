import type { OpportunityType } from "@prisma/client";

import type { DetectedOpportunity } from "@/lib/optimization/types";

export interface OpportunityWriteInput {
  workspaceId: string;
  accountContext: "firma" | "dom" | "razem";
  item: DetectedOpportunity;
  dedupeKey: string;
}

export interface OpportunityCreatePayload {
  workspaceId: string;
  type: OpportunityType;
  accountContext: "firma" | "dom" | "razem";
  title: string;
  description: string;
  estimatedMonthlySavings: number | null;
  counterparty: string | null;
  categoryId: string | null;
  evidenceTransactionIds: string[];
  dedupeKey: string;
}

export function opportunityCreateData(
  input: OpportunityWriteInput,
): OpportunityCreatePayload {
  return {
    workspaceId: input.workspaceId,
    type: input.item.type,
    accountContext: input.accountContext,
    title: input.item.title,
    description: input.item.description,
    estimatedMonthlySavings: input.item.estimatedMonthlySavings,
    counterparty: input.item.counterparty,
    categoryId: input.item.categoryId,
    evidenceTransactionIds: input.item.evidenceTransactionIds,
    dedupeKey: input.dedupeKey,
  };
}

export function opportunityUpdateData(item: DetectedOpportunity): {
  title: string;
  description: string;
  estimatedMonthlySavings: number | null;
  evidenceTransactionIds: string[];
} {
  return {
    title: item.title,
    description: item.description,
    estimatedMonthlySavings: item.estimatedMonthlySavings,
    evidenceTransactionIds: item.evidenceTransactionIds,
  };
}
