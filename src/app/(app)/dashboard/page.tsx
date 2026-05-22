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
import { getAiStatus } from "@/lib/ai/status";
import { resolveDateRange } from "@/lib/analytics/date-range";
import type { ContextFilter } from "@/lib/analytics/filters";
import { loadDashboardData } from "@/lib/analytics/load-dashboard";
import { auth } from "@/lib/auth";

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
  const aiStatus = getAiStatus();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-3">
          <DateRangeToggle active={period} context={context} />
          <ContextToggle active={context} period={period} />
        </div>
      </div>

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
        <p className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {data.uncategorized} transakcji bez kategorii w tym okresie (
          {String(data.categorizedPercent)}% pokrycia) —{" "}
          <Link
            href={`/transactions?uncategorized=1&context=${context}`}
            className="underline"
          >
            ogarnij teraz
          </Link>
        </p>
      ) : null}

      <AiPanel
        aiAvailable={aiStatus.available}
        aiProvider={aiStatus.provider}
        aiTargetCount={data.aiTargetCount}
        context={context}
        initialInsight={data.lastAiInsight}
        initialInsightAt={data.lastAiInsightAt?.toISOString() ?? null}
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold">Wydatki wg kategorii</h2>
          <CategoryChart slices={data.slices} />
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold">Top kontrahenci</h2>
          <MerchantChart merchants={data.merchants} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 font-medium text-slate-700">
            Transakcje w kategoriach — kliknij wiersz, aby rozwinąć
          </h3>
          <CategoryBreakdownPanel groups={data.categoryGroups} context={context} />
        </div>
        <div>
          <h3 className="mb-2 font-medium text-slate-700">Lista kontrahentów</h3>
          <MerchantList merchants={data.merchants} />
        </div>
      </section>
    </div>
  );
}
