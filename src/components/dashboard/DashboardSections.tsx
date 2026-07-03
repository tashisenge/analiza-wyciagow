import { CategoryBreakdownPanel } from "@/components/dashboard/CategoryBreakdownPanel";
import { DashboardCategorySection } from "@/components/dashboard/CategoryChart";
import { MerchantChart } from "@/components/dashboard/MerchantChart";
import { MerchantList } from "@/components/dashboard/MerchantList";
import {
  MonthlyTrendChart,
  YearlySummaryCards,
} from "@/components/dashboard/MonthlyTrendChart";
import type { DashboardData } from "@/lib/analytics/dashboard-types";
import type { resolveDateRange } from "@/lib/analytics/date-range";

export function DashboardTrendSection({
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

export function DashboardChartsSection({
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
