import Link from "next/link";
import { redirect } from "next/navigation";

import { AiPanel } from "@/components/dashboard/AiPanel";
import { CategoryBreakdownPanel } from "@/components/dashboard/CategoryBreakdownPanel";
import { DashboardCategorySection } from "@/components/dashboard/CategoryChart";
import { ContextToggle } from "@/components/dashboard/ContextToggle";
import { DateRangeToggle } from "@/components/dashboard/DateRangeToggle";
import { MerchantChart } from "@/components/dashboard/MerchantChart";
import { MerchantList } from "@/components/dashboard/MerchantList";
import {
  MonthlyTrendChart,
  YearlySummaryCards,
} from "@/components/dashboard/MonthlyTrendChart";
import { OptimizeWidget } from "@/components/dashboard/OptimizeWidget";
import { MonthPicker, YearPicker } from "@/components/dashboard/PeriodPicker";
import { PeriodSummaryCards } from "@/components/dashboard/PeriodSummary";
import {
  RecurringPaymentsWidget,
  SubscriptionsWidget,
} from "@/components/dashboard/RecurringWidgets";
import { PageHeader } from "@/components/ui/PageHeader";
import type { DashboardData } from "@/lib/analytics/dashboard-types";
import type { resolveDateRange } from "@/lib/analytics/date-range";
import { loadDashboardPageContext } from "@/lib/analytics/load-dashboard-page";
import { auth } from "@/lib/auth";
import { countReviewQueue } from "@/lib/review/load-review-queue";

function DashboardTrendSection({
  data,
  range,
  year,
}: {
  data: DashboardData;
  range: ReturnType<typeof resolveDateRange>;
  year: number;
}): React.JSX.Element {
  if (range.isFullYear) {
    return (
      <section className="section-card space-y-4">
        <h2 className="section-title">Podsumowanie roku {year}</h2>
        <YearlySummaryCards summary={data.summary} year={year} />
        <MonthlyTrendChart
          points={data.yearlyMonths}
          yearlyMonths={data.yearlyMonths}
          title="Wydatki miesiąc po miesiącu"
        />
      </section>
    );
  }
  return (
    <section className="section-card">
      <h2 className="section-title mb-3">Trend wydatków (ostatnie 6 miesięcy)</h2>
      <MonthlyTrendChart points={data.monthlyTrend} />
    </section>
  );
}

function DashboardChartsSection({
  data,
  context,
}: {
  data: DashboardData;
  context: string;
}): React.JSX.Element {
  return (
    <>
      <DashboardCategorySection slices={data.slices} context={context}>
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="section-card">
            <h2 className="section-title mb-3">Top kontrahenci</h2>
            <MerchantChart merchants={data.merchants} />
          </div>
          <div className="section-card">
            <h3 className="mb-2 font-medium text-slate-700">Lista kontrahentów</h3>
            <MerchantList merchants={data.merchants} />
          </div>
        </section>
      </DashboardCategorySection>
      <section className="section-card">
        <h3 className="mb-2 font-medium text-slate-700">
          Transakcje w kategoriach — kliknij wiersz, aby rozwinąć
        </h3>
        <CategoryBreakdownPanel groups={data.categoryGroups} context={context} />
      </section>
    </>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ context?: string; period?: string; year?: string; month?: string }>;
}): Promise<React.JSX.Element> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const page = await loadDashboardPageContext(params, session.user.workspaceId);
  const { context, period, year, month, range, data, aiStatus, insightHistory } = page;
  const reviewCount = await countReviewQueue(session.user.workspaceId);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        lead="Przegląd finansów domu i firmy — wybierz okres, miesiąc i kontekst kont."
        actions={
          <div className="flex flex-col gap-2 sm:items-end">
            <DateRangeToggle active={period} context={context} year={year} month={month} />
            {period === "month" ? (
              <MonthPicker context={context} period={period} year={year} month={month} />
            ) : null}
            {period === "year" ? (
              <YearPicker context={context} period={period} year={year} />
            ) : null}
            <ContextToggle active={context} period={period} year={year} month={month} />
          </div>
        }
      />

      <PeriodSummaryCards
        summary={data.summary}
        previous={data.previousSummary}
        periodLabel={range.label}
      />

      <DashboardTrendSection data={data} range={range} year={year} />
      <RecurringPaymentsWidget context={context} payments={data.recurringPayments} />
      <SubscriptionsWidget subscriptions={data.markedSubscriptions} />
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

      {reviewCount > 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {reviewCount} transakcji do weryfikacji mBank —{" "}
          <Link href="/review" className="link-brand font-medium">
            przejdź do kolejki
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
        excludedCategoryCount={page.excludedCategoryCount}
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

      <DashboardChartsSection data={data} context={context} />
    </div>
  );
}
