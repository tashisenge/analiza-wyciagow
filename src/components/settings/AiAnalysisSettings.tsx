import { InfoTip } from "@/components/ui/InfoTip";

interface CategoryOption {
  id: string;
  name: string;
}

interface AiAnalysisSettingsProps {
  categories: CategoryOption[];
  excludedCategoryIds: string[];
  updateExclusionsAction: (formData: FormData) => Promise<void>;
}

export function AiAnalysisSettings({
  categories,
  excludedCategoryIds,
  updateExclusionsAction,
}: AiAnalysisSettingsProps): React.JSX.Element {
  const excludedSet = new Set(excludedCategoryIds);

  return (
    <section className="section-card">
      <h2 className="section-title">
        Analiza AI — wykluczenia
        <InfoTip label="Wykluczone kategorie">
          Transakcje w tych kategoriach nie trafiają do podsumowania AI (tak jak transfery
          między kontami).
        </InfoTip>
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Zaznacz kategorie pomijane w analizie AI (np. transfery, oszczędności, spłaty
        kredytu).
      </p>
      <form action={updateExclusionsAction} className="mt-4 space-y-2">
        {categories.length === 0 ? (
          <p className="text-sm text-slate-500">Brak kategorii w workspace.</p>
        ) : (
          categories.map((category) => (
            <label
              key={category.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-calm-200 px-3 py-2 text-sm hover:bg-calm-50"
            >
              <input
                type="checkbox"
                name="excludedCategoryId"
                value={category.id}
                defaultChecked={excludedSet.has(category.id)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span>{category.name}</span>
            </label>
          ))
        )}
        <button type="submit" className="btn-primary mt-2">
          Zapisz wykluczenia
        </button>
      </form>
    </section>
  );
}
