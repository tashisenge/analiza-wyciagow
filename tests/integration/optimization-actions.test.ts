import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { buildOpportunities } from "@/lib/optimization/build-opportunities";
import {
  loadOptimizePageData,
  refreshWorkspaceOpportunities,
} from "@/lib/optimization/load-optimization-data";

const HAS_DB = Boolean(process.env["DATABASE_URL"]);

function recentMonth(offset: number): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - offset, 5);
}

describe.skipIf(!HAS_DB)("optimization persistence", () => {
  it(
    "upserts opportunities for workspace",
    async () => {
    const workspace = await prisma.workspace.create({ data: { name: "Opt WS" } });
    const account = await prisma.account.create({
      data: { workspaceId: workspace.id, type: "dom", name: "Dom" },
    });
    const category = await prisma.category.create({
      data: { workspaceId: workspace.id, name: "Rozrywka" },
    });

    await prisma.transaction.createMany({
      data: [0, 1, 2].map((offset) => ({
        workspaceId: workspace.id,
        accountId: account.id,
        dedupeHash: `opt-${workspace.id}-${String(offset)}`,
        bookedAt: recentMonth(offset),
        amount: "-49.99",
        description: "NETFLIX",
        counterparty: "NETFLIX",
        categoryId: category.id,
      })),
    });

    const refreshed = await refreshWorkspaceOpportunities(workspace.id, "dom");
    expect(refreshed).toBeGreaterThan(0);

    const page = await loadOptimizePageData(workspace.id, "dom");
    expect(page.open.length).toBeGreaterThan(0);

    const anchor = new Date();
    const detected = buildOpportunities({
      current: [],
      history: [],
      budgets: [],
      anchor,
    });
    expect(detected).toHaveLength(0);

    await prisma.workspace.delete({ where: { id: workspace.id } });
    },
    15_000,
  );
});
