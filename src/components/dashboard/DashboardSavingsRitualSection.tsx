import { SavingsRitualWidget } from "@/components/dashboard/SavingsRitualWidget";
import { buildPeriodHref } from "@/lib/analytics/dashboard-params";
import { buildSavingsRitualSteps } from "@/lib/analytics/savings-ritual-state";

interface DashboardSavingsRitualSectionProps {
  context: string;
  period: string;
  year: number;
  month: number;
  hasImport: boolean;
  isStaleImport: boolean;
  categorizedPercent: number;
  monthlyLimit: number | null;
  limitUsedPercent: number | null;
}

export function DashboardSavingsRitualSection({
  context,
  period,
  year,
  month,
  hasImport,
  isStaleImport,
  categorizedPercent,
  monthlyLimit,
  limitUsedPercent,
}: DashboardSavingsRitualSectionProps): React.JSX.Element {
  const steps = buildSavingsRitualSteps(
    { hasImport, isStaleImport, categorizedPercent, monthlyLimit, limitUsedPercent },
    {
      importHref: "/import",
      transactionsHref: `/transactions?uncategorized=1&context=${context}`,
      opcjonalneHref: buildPeriodHref("/opcjonalne", { context, period, year, month }),
    },
  );
  return <SavingsRitualWidget steps={steps} />;
}
