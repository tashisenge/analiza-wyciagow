import { accountIdsForContext, type ContextFilter } from "@/lib/analytics/filters";
import { prisma } from "@/lib/db";

export async function loadInsightTransactions(
  workspaceId: string,
  contextParam: string,
): Promise<{
  transactions: Awaited<
    ReturnType<typeof prisma.transaction.findMany<{ include: { category: true } }>>
  >;
  periodLabel: string;
}> {
  const context: ContextFilter =
    contextParam === "firma" || contextParam === "dom" ? contextParam : "razem";
  const accounts = await prisma.account.findMany({ where: { workspaceId } });
  const accountIds = accountIdsForContext(accounts, context);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const transactions = await prisma.transaction.findMany({
    where: {
      workspaceId,
      accountId: { in: accountIds },
      bookedAt: { gte: prevStart, lte: now },
    },
    include: { category: true },
  });

  const contextLabel = context === "razem" ? "" : ` (${context})`;
  const periodLabel = `${monthStart.toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}${contextLabel}`;

  return { transactions, periodLabel };
}
