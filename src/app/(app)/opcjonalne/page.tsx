import Link from "next/link";
import { redirect } from "next/navigation";

import { ContextToggle } from "@/components/dashboard/ContextToggle";
import { DateRangeToggle } from "@/components/dashboard/DateRangeToggle";
import { MonthPicker, YearPicker } from "@/components/dashboard/PeriodPicker";
import { DiscretionaryLimitEditor } from "@/components/discretionary/DiscretionaryLimitEditor";
import { DiscretionaryMerchantsTable } from "@/components/discretionary/DiscretionaryMerchantsTable";
import { DiscretionarySummaryCards } from "@/components/discretionary/DiscretionarySummaryCards";
import { PageHeader } from "@/components/ui/PageHeader";
import { parseDashboardParams } from "@/lib/analytics/dashboard-params";
import { resolveDateRange } from "@/lib/analytics/date-range";
import { auth } from "@/lib/auth";
import { loadDiscretionaryPageData } from "@/lib/discretionary/load-discretionary-page";

const BASE_PATH = "/opcjonalne";

export default async function OpcjonalnePage({
  searchParams,
}: {
  searchParams: Promise<{ context?: string; period?: string; year?: string; month?: string }>;
}): Promise<React.JSX.Element> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const { context, period, year: yearParam, month: monthParam } = parseDashboardParams(params);
  const now = new Date();
  const year = yearParam ?? now.getFullYear();
  const month = monthParam ?? now.getMonth() + 1;
  const range = resolveDateRange(period, now, {
    year: period === "month" || period === "year" ? year : undefined,
    month: period === "month" ? month : undefined,
  });

  const data = await loadDiscretionaryPageData(session.user.workspaceId, context, range);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Wydatki opcjonalne"
        lead="To, na co możecie się wspólnie zgodzić, że da się ograniczyć — na podstawie kategorii oznaczonych jako opcjonalne."
        tip="Oznacz kategorie na stronie Kategorie. Domyślnie „Rozrywka” jest opcjonalna."
        actions={
          <div className="flex flex-col gap-2 sm:items-end">
            <DateRangeToggle
              active={period}
              context={context}
              year={year}
              month={month}
              basePath={BASE_PATH}
            />
            {period === "month" ? (
              <MonthPicker
                context={context}
                period={period}
                year={year}
                month={month}
                basePath={BASE_PATH}
              />
            ) : null}
            {period === "year" ? (
              <YearPicker context={context} period={period} year={year} basePath={BASE_PATH} />
            ) : null}
            <ContextToggle
              active={context}
              period={period}
              year={year}
              month={month}
              basePath={BASE_PATH}
            />
          </div>
        }
      />

      {data.coveragePercent < 80 ? (
        <p className="alert-warning text-sm">
          Tylko {data.coveragePercent.toFixed(1)}% wydatków ma przypisaną kategorię — wnioski mogą być
          niepełne.{" "}
          <Link href={`/transactions?uncategorized=1&context=${context}`} className="link-brand">
            Uzupełnij kategorie
          </Link>
        </p>
      ) : null}

      {data.discretionaryCategoryIds.length === 0 ? (
        <p className="section-card text-sm text-slate-600">
          Brak kategorii oznaczonych jako opcjonalne.{" "}
          <Link href="/categories" className="link-brand">
            Przejdź do kategorii
          </Link>{" "}
          i zaznacz „Opcjonalny” przy np. Rozrywka.
        </p>
      ) : null}

      <DiscretionarySummaryCards
        summary={data.summary}
        monthlyLimit={data.monthlyLimit}
        limitUsedPercent={data.limitUsedPercent}
        periodLabel={range.label}
      />

      <DiscretionaryLimitEditor context={context} currentLimit={data.monthlyLimit} />

      <DiscretionaryMerchantsTable merchants={data.merchants} context={context} />
    </div>
  );
}
