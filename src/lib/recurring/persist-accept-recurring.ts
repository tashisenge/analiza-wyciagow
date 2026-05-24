import type { OptimizationOpportunity, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

async function markSubscriptionFromOpportunity(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  opportunity: OptimizationOpportunity,
): Promise<void> {
  if (!opportunity.counterparty) {
    return;
  }
  await tx.subscriptionMarker.upsert({
    where: {
      workspaceId_counterparty: {
        workspaceId,
        counterparty: opportunity.counterparty,
      },
    },
    create: {
      workspaceId,
      counterparty: opportunity.counterparty,
      note:
        opportunity.type === "SUBSCRIPTION" ? "Subskrypcja (AI)" : "Płatność regularna",
    },
    update: {},
  });
}

export async function persistAcceptRecurringOpportunity(
  workspaceId: string,
  opportunity: OptimizationOpportunity,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.optimizationOpportunity.update({
      where: { id: opportunity.id },
      data: {
        status: "ACKNOWLEDGED",
        resolvedAt: new Date(),
        followUpNote: "Zaakceptowane przez użytkownika",
      },
    });
    await markSubscriptionFromOpportunity(tx, workspaceId, opportunity);
  });
}
