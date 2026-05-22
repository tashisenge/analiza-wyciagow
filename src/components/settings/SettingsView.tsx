import Link from "next/link";

import { PrivacyAmountsToggle } from "@/components/privacy/PrivacyAmountsToggle";
import { CopyInviteButton } from "@/components/settings/CopyInviteButton";

interface AccountRow {
  id: string;
  name: string;
  type: string;
}

interface MemberRow {
  id: string;
  user: { email: string };
}

interface SettingsViewProps {
  workspaceName: string;
  inviteCode: string;
  accounts: AccountRow[];
  members: MemberRow[];
  createAccountAction: (formData: FormData) => Promise<void>;
  deleteDataAction: (formData: FormData) => Promise<void>;
  error?: string;
  deleted?: boolean;
}

export function SettingsView({
  workspaceName,
  inviteCode,
  accounts,
  members,
  createAccountAction,
  deleteDataAction,
  error,
  deleted,
}: SettingsViewProps): React.JSX.Element {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Ustawienia</h1>

      {error ? (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      {deleted ? (
        <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">
          Wszystkie transakcje zostały usunięte. Kategorie i konta zostały.
        </p>
      ) : null}

      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-semibold">Prywatność przy pokazywaniu ekranu</h2>
        <PrivacyAmountsToggle />
      </section>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="font-semibold">Zaproszenie partnera</h2>
        <p className="mt-1 text-sm text-slate-600">
          Drugi użytkownik rejestruje się z tym kodem w polu „Kod zaproszenia”:
        </p>
        <code className="mt-2 block rounded bg-slate-100 px-3 py-2 text-sm">
          {inviteCode}
        </code>
        <CopyInviteButton code={inviteCode} />
      </section>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 font-semibold">Nowe konto bankowe</h2>
        <form action={createAccountAction} className="flex flex-wrap gap-2">
          <input
            name="name"
            required
            placeholder="Nazwa konta"
            className="rounded border px-3 py-2 text-sm"
          />
          <select name="type" className="rounded border px-3 py-2 text-sm">
            <option value="dom">Dom</option>
            <option value="firma">Firma</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white"
          >
            Dodaj konto
          </button>
        </form>
        <ul className="mt-4 space-y-1 text-sm">
          {accounts.map((account) => (
            <li key={account.id} className="rounded border px-3 py-2">
              {account.name} ({account.type})
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Członkowie</h2>
        <ul className="space-y-1 text-sm">
          {members.map((member) => (
            <li key={member.id}>{member.user.email}</li>
          ))}
        </ul>
      </section>

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
          Usuwa transakcje i historię importów. Kategorie, konta i użytkownicy zostają.
          Wpisz: <strong>{workspaceName}</strong>
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
    </div>
  );
}
