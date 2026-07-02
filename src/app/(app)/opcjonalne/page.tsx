import { redirect } from "next/navigation";

import { ContextToggle } from "@/components/dashboard/ContextToggle";
import { DateRangeToggle } from "@/components/dashboard/DateRangeToggle";
import { MonthPicker, YearPicker } from "@/components/dashboard/PeriodPicker";
import { DiscretionaryAiPanel } from "@/components/discretionary/DiscretionaryAiPanel";
import { DiscretionaryLimitAlert } from "@/components/discretionary/DiscretionaryLimitAlert";
import { DiscretionaryLimitEditor } from "@/components/discretionary/DiscretionaryLimitEditor";
import { DiscretionaryMerchantsTable } from "@/components/discretionary/DiscretionaryMerchantsTable";
import { DiscretionaryPageNotices } from "@/components/discretionary/DiscretionaryPageNotices";
import { DiscretionaryPersonBreakdown } from "@/components/discretionary/DiscretionaryPersonBreakdown";
import { DiscretionarySummaryCards } from "@/components/discretionary/DiscretionarySummaryCards";
import { PageHeader } from "@/components/ui/PageHeader";
import { parseDashboardParams } from "@/lib/analytics/dashboard-params";
import { resolveDateRange } from "@/lib/analytics/date-range";
import { auth } from "@/lib/auth";
import { loadOpcjonalnePage } from "@/lib/discretionary/load-opcjonalne-page";

const BASE_PATH = "/opcjonalne";

export default async function OpcjonalnePage({
  searchParams,
}: {
  searchParams: Promise<{
    context?: string;
    period?: string;
    year?: string;
    month?: string;
  }>;
}): Promise<React.JSX.Element> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const {
    context,
    period,
    year: yearParam,
    month: monthParam,
  } = parseDashboardParams(params);
  const now = new Date();
  const year = yearParam ?? now.getFullYear();
  const month = monthParam ?? now.getMonth() + 1;
  const range = resolveDateRange(period, now, {
    year: period === "month" || period === "year" ? year : undefined,
    month: period === "month" ? month : undefined,
  });

  const { data, aiStatus, insightHistory, canGenerateAi } = await loadOpcjonalnePage(
    session.user.workspaceId,
    context,
    range,
  );

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
              <YearPicker
                context={context}
                period={period}
                year={year}
                basePath={BASE_PATH}
              />
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

      <DiscretionaryLimitAlert
        totalPln={data.summary.totalPln}
        monthlyLimit={data.monthlyLimit}
        limitUsedPercent={data.limitUsedPercent}
      />

      <DiscretionaryPageNotices
        context={context}
        coveragePercent={data.coveragePercent}
        discretionaryCategoryCount={data.discretionaryCategoryIds.length}
      />

      <DiscretionarySummaryCards
        summary={data.summary}
        monthlyLimit={data.monthlyLimit}
        limitUsedPercent={data.limitUsedPercent}
        periodLabel={range.label}
      />

      <DiscretionaryPersonBreakdown rows={data.personBreakdown} />

      <DiscretionaryLimitEditor context={context} currentLimit={data.monthlyLimit} />

      <DiscretionaryAiPanel
        aiAvailable={aiStatus.available}
        context={context}
        period={period}
        year={year}
        month={month}
        canGenerate={canGenerateAi}
        insightHistory={insightHistory.map((entry) => ({
          id: entry.id,
          context: entry.context,
          provider: entry.provider,
          contentMarkdown: entry.contentMarkdown,
          periodLabel: entry.periodLabel,
          createdAt: entry.createdAt.toISOString(),
        }))}
      />

      <DiscretionaryMerchantsTable merchants={data.merchants} context={context} />
    </div>
  );
}
