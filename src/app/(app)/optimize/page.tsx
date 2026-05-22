import { redirect } from "next/navigation";

import { ContextToggle } from "@/components/dashboard/ContextToggle";
import { BudgetEditor } from "@/components/optimization/BudgetEditor";
import { OptimizePanel } from "@/components/optimization/OptimizePanel";
import { PageHeader } from "@/components/ui/PageHeader";
import type { ContextFilter } from "@/lib/analytics/filters";
import { auth } from "@/lib/auth";
import { loadOptimizePageData } from "@/lib/optimization/load-optimization-data";
import { mapOpportunitiesForCards } from "@/lib/optimization/map-opportunity-cards";

export default async function OptimizePage({
  searchParams,
}: {
  searchParams: Promise<{ context?: string }>;
}): Promise<React.JSX.Element> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const context = (params.context ?? "razem") as ContextFilter;
  const data = await loadOptimizePageData(session.user.workspaceId, context);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Optymalizacja budżetu"
        lead="Sugestie oszczędności, limity kategorii i śledzenie wdrożonych zmian."
        tip="Kontekst filtruje konta tak jak na dashboardzie."
        actions={<ContextToggle active={context} basePath="/optimize" />}
      />

      <p className="text-sm text-slate-600">
        Wykryte możliwości oszczędności, limity kategorii i śledzenie wdrożonych zmian.
        {data.dismissedCount > 0 ? ` Odrzuconych: ${String(data.dismissedCount)}.` : null}
      </p>

      <OptimizePanel
        context={context}
        open={mapOpportunitiesForCards(data.open)}
        implemented={mapOpportunitiesForCards(data.implemented)}
      />

      <BudgetEditor
        context={context}
        categories={data.categories}
        budgets={data.budgets}
      />
    </div>
  );
}
