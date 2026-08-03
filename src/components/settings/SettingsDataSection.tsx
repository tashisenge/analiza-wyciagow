import Link from "next/link";

interface SettingsDataSectionProps {
  workspaceName: string;
  deleteDataAction: (formData: FormData) => Promise<void>;
}

export function SettingsDataSection({
  workspaceName,
  deleteDataAction,
}: SettingsDataSectionProps): React.JSX.Element {
  return (
    <>
      <section className="rounded-lg border bg-white p-4">
        <h2 className="font-semibold">Eksport danych</h2>
        <p className="mt-1 text-sm text-slate-600">
          Pobierz wszystkie transakcje jako CSV (UTF-8).
        </p>
        <Link
          href="/api/export/csv"
          className="mt-3 inline-block rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
        >
          Pobierz CSV
        </Link>
      </section>

      <section className="rounded-lg border border-red-200 bg-red-50/50 p-4">
        <h2 className="font-semibold text-red-900">Usuń wszystkie transakcje</h2>
        <p className="mt-1 text-sm text-red-800">
          Usuwa transakcje, historię importów oraz powiązane sugestie optymalizacji,
          oznaczenia subskrypcji i wglądy AI. Kategorie, reguły kategoryzacji, pamięć
          merchantów, konta i użytkownicy zostają. Wpisz: <strong>{workspaceName}</strong>
        </p>
        <form action={deleteDataAction} className="mt-3 flex flex-wrap gap-2">
          <input
            name="confirmName"
            required
            placeholder={workspaceName}
            className="rounded border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Usuń transakcje
          </button>
        </form>
      </section>
    </>
  );
}
