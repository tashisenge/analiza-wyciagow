import { redirect } from "next/navigation";

import { InfoTip } from "@/components/ui/InfoTip";
import { PageHeader } from "@/components/ui/PageHeader";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { importCsv } from "@/server/actions/import";

async function importAction(formData: FormData): Promise<void> {
  "use server";
  const result = await importCsv(formData);
  if (!result.ok) {
    redirect(`/import?error=${encodeURIComponent(result.error)}`);
  }
  redirect(
    `/import?ok=${String(result.newCount)}&skipped=${String(result.skippedCount)}`,
  );
}

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; skipped?: string; error?: string }>;
}): Promise<React.JSX.Element> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const workspaceId = session.user.workspaceId;
  const accounts = await prisma.account.findMany({
    where: { workspaceId },
    orderBy: { type: "asc" },
  });
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import CSV"
        lead="Pobierz plik z mBank: Finanse → Zestawienie operacji → CSV (Lista operacji)."
        tip="Duplikaty są pomijane na podstawie hash transakcji."
      />
      <form action={importAction} className="section-card flex max-w-md flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="flex items-center gap-0.5">
            Konto
            <InfoTip label="Konto docelowe">
              Wybierz konto dom lub firma — transakcje trafią pod ten kontekst.
            </InfoTip>
          </span>
          <select name="accountId" required className="input-field">
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.type})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Plik CSV
          <input name="file" type="file" accept=".csv" required className="text-sm" />
        </label>
        <button type="submit" className="btn-primary">
          Importuj
        </button>
      </form>
      {params.error ? <p className="alert-error">{params.error}</p> : null}
      {params.ok ? (
        <p className="alert-success">
          Zaimportowano {params.ok} transakcji (pominięto duplikaty:{" "}
          {params.skipped ?? "0"}
          ).
        </p>
      ) : null}
    </div>
  );
}
