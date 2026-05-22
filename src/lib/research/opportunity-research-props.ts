import type { OpportunityType } from "@prisma/client";

import { isResearchEligible } from "@/lib/research/is-research-eligible";
import { mapResearchToView } from "@/lib/research/map-research-view";
import type { OpportunityResearchView } from "@/lib/research/types";

interface OpportunityWithResearch {
  id: string;
  type: OpportunityType;
  counterparty: string | null;
  research?: Parameters<typeof mapResearchToView>[0];
}

export function buildResearchSectionProps(
  opportunity: OpportunityWithResearch,
  researchAvailable: boolean,
): {
  opportunityId: string;
  eligible: boolean;
  researchAvailable: boolean;
  initialResearch: OpportunityResearchView | null;
} {
  return {
    opportunityId: opportunity.id,
    eligible: isResearchEligible(opportunity.type, opportunity.counterparty),
    researchAvailable,
    initialResearch: mapResearchToView(opportunity.research ?? null),
  };
}
