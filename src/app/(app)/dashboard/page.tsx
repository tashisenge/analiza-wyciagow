import Link from "next/link";
import { redirect } from "next/navigation";

import { AiPanel } from "@/components/dashboard/AiPanel";
import { CategoryBreakdownPanel } from "@/components/dashboard/CategoryBreakdownPanel";
import { CategoryChart } from "@/components/dashboard/CategoryChart";
import { ContextToggle } from "@/components/dashboard/ContextToggle";
import { DateRangeToggle } from "@/components/dashboard/DateRangeToggle";
import { MerchantChart } from "@/components/dashboard/MerchantChart";
import { MerchantList } from "@/components/dashboard/MerchantList";
import { OptimizeWidget } from "@/components/dashboard/OptimizeWidget";
import { PeriodSummaryCards } from "@/components/dashboard/PeriodSummary";
import { PageHeader } from "@/components/ui/PageHeader";
import { loadAiInsightHistory } from "@/lib/ai/load-ai-insight-history";
import { getWorkspaceAiStatus } from "@/lib/ai/status";
import { resolveDateRange } from "@/lib/analytics/date-range";
import type { ContextFilter } from "@/lib/analytics/filters";
import { loadDashboardData } from "@/lib/analytics/load-dashboard";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ context?: string; period?: string }>;
}): Promise<React.JSX.Element> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const context = (params.context ?? "razem") as ContextFilter;
  const period = params.period ?? "month";
  const range = resolveDateRange(period);
  const data = await loadDashboardData(session.user.workspaceId, context, range);
  const [aiStatus, insightHistory, workspace] = await Promise.all([
    getWorkspaceAiStatus(session.user.workspaceId),
    loadAiInsightHistory(session.user.workspaceId),
    prisma.workspace.findUnique({
      where: { id: session.user.workspaceId },
      select: { analysisExcludedCategoryIds: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        lead="Przegląd finansów domu i firmy — wybierz okres i kontekst kont."
        actions={
          <div className="flex flex-col gap-2 sm:items-end">
            <DateRangeToggle active={period} context={context} />
            <ContextToggle active={context} period={period} />
          </div>
        }
      />

      <PeriodSummaryCards
        summary={data.summary}
        previous={data.previousSummary}
        periodLabel={range.label}
      />

      <OptimizeWidget
        context={context}
        opportunities={data.topOpportunities}
        budgetOverrunCount={data.budgetOverrunCount}
      />

      {data.uncategorized > 0 ? (
        <p className="alert-warning">
          {data.uncategorized} transakcji bez kategorii w tym okresie (
          {String(data.categorizedPercent)}% pokrycia) —{" "}
          <Link
            href={`/transactions?uncategorized=1&context=${context}`}
            className="link-brand"
          >
            ogarnij teraz
          </Link>
        </p>
      ) : null}

      <AiPanel
        aiAvailable={aiStatus.available}
        aiPreference={aiStatus.preference}
        activeProvider={aiStatus.activeProvider}
        availableProviders={aiStatus.availableProviders}
        aiTargetCount={data.aiTargetCount}
        context={context}
        excludedCategoryCount={workspace?.analysisExcludedCategoryIds.length ?? 0}
        insightHistory={insightHistory.map((entry) => ({
          id: entry.id,
          context: entry.context,
          provider: entry.provider,
          contentMarkdown: entry.contentMarkdown,
          transfersFiltered: entry.transfersFiltered,
          excludedTxCount: entry.excludedTxCount,
          createdAt: entry.createdAt.toISOString(),
        }))}
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="section-card">
          <h2 className="section-title mb-3">Wydatki wg kategorii</h2>
          <CategoryChart slices={data.slices} />
        </div>
        <div className="section-card">
          <h2 className="section-title mb-3">Top kontrahenci</h2>
          <MerchantChart merchants={data.merchants} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="section-card">
          <h3 className="mb-2 font-medium text-slate-700">
            Transakcje w kategoriach — kliknij wiersz, aby rozwinąć
          </h3>
          <CategoryBreakdownPanel groups={data.categoryGroups} context={context} />
        </div>
        <div className="section-card">
          <h3 className="mb-2 font-medium text-slate-700">Lista kontrahentów</h3>
          <MerchantList merchants={data.merchants} />
        </div>
      </section>
    </div>
  );
}
