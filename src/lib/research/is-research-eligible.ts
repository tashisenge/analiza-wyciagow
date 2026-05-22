import type { OpportunityType } from "@prisma/client";

import { RESEARCH_ELIGIBLE_TYPES } from "@/lib/research/types";

export function isResearchEligible(
  type: OpportunityType,
  counterparty: string | null,
): boolean {
  if (!counterparty?.trim()) {
    return false;
  }
  return RESEARCH_ELIGIBLE_TYPES.includes(
    type as (typeof RESEARCH_ELIGIBLE_TYPES)[number],
  );
}
