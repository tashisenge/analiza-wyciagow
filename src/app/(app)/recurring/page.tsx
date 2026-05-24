import { redirect } from "next/navigation";

import { ContextToggle } from "@/components/dashboard/ContextToggle";
import { RecurringSuspectsView } from "@/components/recurring/RecurringSuspectsView";
import { PageHeader } from "@/components/ui/PageHeader";
import type { ContextFilter } from "@/lib/analytics/filters";
import { auth } from "@/lib/auth";
import { loadRecurringPageData } from "@/lib/recurring/load-recurring-page";
import type { RecurringStatusFilter } from "@/lib/recurring/recurring-suspect-types";

function parseStatusFilter(value: string | undefined): RecurringStatusFilter {
  if (value === "accepted" || value === "dismissed" || value === "all") {
    return value;
  }
  return "open";
}

export default async function RecurringPage({
  searchParams,
}: {
  searchParams: Promise<{ context?: string; status?: string }>;
}): Promise<React.JSX.Element> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const context = (params.context ?? "razem") as ContextFilter;
  const statusFilter = parseStatusFilter(params.status);
  const data = await loadRecurringPageData(
    session.user.workspaceId,
    context,
    statusFilter,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Płatności regularne"
        lead="Wszystkie podejrzenia powtarzalnych płatności i subskrypcji wykryte automatycznie na podstawie historii transakcji."
        tip="Zaakceptuj sugestię, aby oznaczyć kontrahenta jako subskrypcję. Odrzuć, jeśli to jednorazowe wydatki."
        actions={<ContextToggle active={context} basePath="/recurring" />}
      />

      <RecurringSuspectsView
        context={context}
        statusFilter={statusFilter}
        suspects={data.suspects}
        openCount={data.openCount}
        acceptedCount={data.acceptedCount}
        dismissedCount={data.dismissedCount}
      />
    </div>
  );
}
