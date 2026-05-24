interface BulkCategoryFilterFieldsProps {
  counterpartyContains: string;
  mbankCategory: string;
  uncategorizedOnly: boolean;
  onCounterpartyChange: (value: string) => void;
  onMbankCategoryChange: (value: string) => void;
  onUncategorizedChange: (value: boolean) => void;
}

export function BulkCategoryFilterFields({
  counterpartyContains,
  mbankCategory,
  uncategorizedOnly,
  onCounterpartyChange,
  onMbankCategoryChange,
  onUncategorizedChange,
}: BulkCategoryFilterFieldsProps): React.JSX.Element {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-xs text-slate-600">
        Kontrahent zawiera
        <input
          value={counterpartyContains}
          onChange={(event) => {
            onCounterpartyChange(event.target.value);
          }}
          className="input-field mt-1 w-full text-xs"
          placeholder="np. LIDL"
        />
      </label>
      <label className="text-xs text-slate-600">
        Kategoria mBank
        <input
          value={mbankCategory}
          onChange={(event) => {
            onMbankCategoryChange(event.target.value);
          }}
          className="input-field mt-1 w-full text-xs"
          placeholder="np. Żywność i chemia domowa"
        />
      </label>
      <label className="flex items-center gap-2 text-xs text-slate-600 sm:col-span-2">
        <input
          type="checkbox"
          checked={uncategorizedOnly}
          onChange={(event) => {
            onUncategorizedChange(event.target.checked);
          }}
        />
        Tylko bez kategorii app
      </label>
    </div>
  );
}
