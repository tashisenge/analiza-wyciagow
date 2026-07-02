import Link from "next/link";

import { DiscretionaryLimitAlert } from "@/components/discretionary/DiscretionaryLimitAlert";
import { AmountValue } from "@/components/privacy/AmountValue";
import { buildPeriodHref } from "@/lib/analytics/dashboard-params";
import type { DiscretionaryPeriodSummary } from "@/lib/discretionary/types";

interface DiscretionaryWidgetProps {
  context: string;
  period: string;
  year: number;
  month: number;
  summary: DiscretionaryPeriodSummary;
  monthlyLimit: number | null;
  limitUsedPercent: number | null;
  hasDiscretionaryCategories: boolean;
}

export function DiscretionaryWidget({
  context,
  period,
  year,
  month,
  summary,
  monthlyLimit,
  limitUsedPercent,
  hasDiscretionaryCategories,
}: DiscretionaryWidgetProps): React.JSX.Element | null {
  if (!hasDiscretionaryCategories && summary.totalPln === 0 && monthlyLimit === null) {
    return null;
  }

  const href = buildPeriodHref("/opcjonalne", { context, period, year, month });

  return (
    <section className="section-card border-orange-200 bg-orange-50/40">
      <div className="flex items-center justify-between gap-2">
        <h2 className="section-title text-orange-900">Wydatki opcjonalne</h2>
        <Link href={href} className="link-brand text-sm">
          Szczegóły →
        </Link>
      </div>
      <DiscretionaryLimitAlert
        totalPln={summary.totalPln}
        monthlyLimit={monthlyLimit}
        limitUsedPercent={limitUsedPercent}
      />
      <p className="mt-2 text-sm text-orange-900">
        <AmountValue className="font-semibold">
          {summary.totalPln.toFixed(2)} PLN
        </AmountValue>
        {summary.shareOfExpensesPercent !== null ? (
          <> · {summary.shareOfExpensesPercent.toFixed(1)}% wydatków</>
        ) : null}
        {summary.shareOfIncomePercent !== null ? (
          <> · {summary.shareOfIncomePercent.toFixed(1)}% dochodu</>
        ) : null}
        {summary.vsPreviousPeriodPercent !== null ? (
          <>
            {" "}
            · {summary.vsPreviousPeriodPercent > 0 ? "+" : ""}
            {summary.vsPreviousPeriodPercent.toFixed(1)}% vs poprzedni okres
          </>
        ) : null}
      </p>
      {monthlyLimit !== null && limitUsedPercent !== null ? (
        <p className="mt-1 text-xs text-orange-800">
          Limit: {limitUsedPercent.toFixed(1)}% wykorzystane (
          <AmountValue>{monthlyLimit.toFixed(2)} PLN</AmountValue>/mies.)
        </p>
      ) : null}
    </section>
  );
}
