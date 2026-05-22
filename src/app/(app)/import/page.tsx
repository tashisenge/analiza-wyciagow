import { redirect } from "next/navigation";

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
      <h1 className="text-2xl font-bold">Import CSV z mBank</h1>
      <p className="text-sm text-slate-600">
        Pobierz plik: Finanse → Zestawienie operacji → CSV (format „Lista operacji”).
      </p>
      <form
        action={importAction}
        className="flex max-w-md flex-col gap-3 rounded-lg border bg-white p-4"
      >
        <label className="flex flex-col gap-1 text-sm">
          Konto
          <select name="accountId" required className="rounded border px-3 py-2">
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
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Importuj
        </button>
      </form>
      {params.error ? <p className="text-sm text-red-600">{params.error}</p> : null}
      {params.ok ? (
        <p className="text-sm text-green-700">
          Zaimportowano {params.ok} transakcji (pominięto duplikaty:{" "}
          {params.skipped ?? "0"}).
        </p>
      ) : null}
    </div>
  );
}
