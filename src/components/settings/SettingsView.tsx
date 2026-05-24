import { PrivacyAmountsToggle } from "@/components/privacy/PrivacyAmountsToggle";
import { AiAnalysisSettings } from "@/components/settings/AiAnalysisSettings";
import { AiProviderSettings } from "@/components/settings/AiProviderSettings";
import { CopyInviteButton } from "@/components/settings/CopyInviteButton";
import { SettingsDataSection } from "@/components/settings/SettingsDataSection";
import { InfoTip } from "@/components/ui/InfoTip";
import { PageHeader } from "@/components/ui/PageHeader";
import type { AiProviderInfo } from "@/lib/ai/provider-status";

interface AccountRow {
  id: string;
  name: string;
  type: string;
}

interface MemberRow {
  id: string;
  user: { email: string };
}

interface CategoryOption {
  id: string;
  name: string;
}

interface SettingsViewProps {
  workspaceName: string;
  inviteCode: string;
  accounts: AccountRow[];
  members: MemberRow[];
  categories: CategoryOption[];
  excludedCategoryIds: string[];
  aiAvailable: boolean;
  aiPreference: string;
  activeProvider: string | null;
  availableProviders: string[];
  aiProviders: AiProviderInfo[];
  envDefaultProvider: string | null;
  updateExclusionsAction: (formData: FormData) => Promise<void>;
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
  categories,
  excludedCategoryIds,
  aiAvailable,
  aiPreference,
  activeProvider,
  availableProviders,
  aiProviders,
  envDefaultProvider,
  updateExclusionsAction,
  createAccountAction,
  deleteDataAction,
  error,
  deleted,
}: SettingsViewProps): React.JSX.Element {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Ustawienia"
        lead="Konta, zaproszenia partnera i opcje prywatności."
      />

      {error ? <p className="alert-error">{error}</p> : null}
      {deleted ? (
        <p className="alert-success">
          Wszystkie transakcje zostały usunięte. Kategorie i konta zostały.
        </p>
      ) : null}

      <AiProviderSettings
        aiAvailable={aiAvailable}
        preference={aiPreference}
        activeProvider={activeProvider}
        availableProviders={availableProviders}
        providers={aiProviders}
        envDefaultProvider={envDefaultProvider}
      />

      <AiAnalysisSettings
        categories={categories}
        excludedCategoryIds={excludedCategoryIds}
        updateExclusionsAction={updateExclusionsAction}
      />

      <section className="section-card">
        <h2 className="section-title mb-3">Prywatność przy pokazywaniu ekranu</h2>
        <PrivacyAmountsToggle />
      </section>

      <section className="section-card">
        <h2 className="section-title">
          Zaproszenie partnera
          <InfoTip label="Kod zaproszenia">
            Partner rejestruje się z tym kodem — trafi do tego samego workspace.
          </InfoTip>
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Drugi użytkownik rejestruje się z tym kodem w polu „Kod zaproszenia”:
        </p>
        <code className="mt-2 block rounded bg-slate-100 px-3 py-2 text-sm">
          {inviteCode}
        </code>
        <CopyInviteButton code={inviteCode} />
      </section>

      <section className="section-card">
        <h2 className="section-title mb-3">Nowe konto bankowe</h2>
        <form action={createAccountAction} className="flex flex-wrap gap-2">
          <input
            name="name"
            required
            placeholder="Nazwa konta"
            className="input-field max-w-xs"
          />
          <select name="type" className="input-field w-auto">
            <option value="dom">Dom</option>
            <option value="firma">Firma</option>
          </select>
          <button type="submit" className="btn-primary">
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

      <SettingsDataSection
        workspaceName={workspaceName}
        deleteDataAction={deleteDataAction}
      />
    </div>
  );
}
