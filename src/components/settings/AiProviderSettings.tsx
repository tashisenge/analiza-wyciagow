import { AiProviderSelect } from "@/components/dashboard/AiProviderSelect";
import { InfoTip } from "@/components/ui/InfoTip";
import type { AiProviderInfo } from "@/lib/ai/provider-status";

interface AiProviderSettingsProps {
  aiAvailable: boolean;
  preference: string;
  activeProvider: string | null;
  availableProviders: string[];
  providers: AiProviderInfo[];
  envDefaultProvider: string | null;
}

export function AiProviderSettings({
  aiAvailable,
  preference,
  activeProvider,
  availableProviders,
  providers,
  envDefaultProvider,
}: AiProviderSettingsProps): React.JSX.Element {
  return (
    <section className="section-card border-brand-200 bg-brand-50/40">
      <h2 className="section-title text-brand-900">
        Dostawcy AI
        <InfoTip label="Konfiguracja AI">
          Klucze API ustawiasz w zmiennych środowiskowych (.env lokalnie, Vercel w
          produkcji). Tutaj wybierasz, którego dostawcę ma używać workspace.
        </InfoTip>
      </h2>
      <p className="mt-1 text-sm text-brand-800">
        Dotyczy kategoryzacji AI i analiz na dashboardzie. Preferencja jest zapisana per
        workspace.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className={`rounded-lg border px-3 py-3 text-sm ${
              provider.configured
                ? "border-emerald-200 bg-emerald-50/60"
                : "border-calm-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-slate-900">{provider.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  provider.configured
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {provider.configured ? "skonfigurowany" : "brak klucza"}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Zmienna:{" "}
              <code className="rounded bg-slate-100 px-1">{provider.envKey}</code>
            </p>
            {provider.configured && provider.model ? (
              <p className="mt-1 text-xs text-slate-600">
                Model: <span className="font-medium">{provider.model}</span>
                <span className="text-slate-400">
                  {" "}
                  ({provider.modelEnvKey} opcjonalnie)
                </span>
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {envDefaultProvider ? (
        <p className="mt-3 text-xs text-slate-600">
          W .env ustawiono <code className="rounded bg-slate-100 px-1">AI_PROVIDER</code>={" "}
          <strong>{envDefaultProvider}</strong> — używane przy preferencji „Auto”.
        </p>
      ) : null}

      <div className="mt-4 rounded-lg border border-calm-200 bg-white p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Preferowany dostawca
        </p>
        <div className="mt-2">
          <AiProviderSelect
            preference={preference}
            activeProvider={activeProvider}
            availableProviders={availableProviders}
            showFeedback
          />
        </div>
        {!aiAvailable ? (
          <p className="mt-2 text-sm text-amber-800">
            Żaden dostawca nie jest dostępny — dodaj co najmniej jeden klucz API w .env
            lub Vercel i zrestartuj / zrób redeploy.
          </p>
        ) : null}
      </div>

      <details className="mt-3 text-sm text-slate-600">
        <summary className="cursor-pointer font-medium text-brand-800">
          Jak skonfigurować klucze?
        </summary>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
          <li>
            Lokalnie: skopiuj <code>.env.example</code> → <code>.env</code> i uzupełnij
            klucze.
          </li>
          <li>
            Vercel: Settings → Environment Variables → <code>ANTHROPIC_API_KEY</code> lub{" "}
            <code>OPENAI_API_KEY</code>.
          </li>
          <li>
            Opcjonalnie: <code>AI_PROVIDER=anthropic|openai</code> dla trybu Auto.
          </li>
        </ul>
      </details>
    </section>
  );
}
