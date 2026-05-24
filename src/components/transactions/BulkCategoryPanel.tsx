"use client";

import { BulkCategoryFilterFields } from "@/components/transactions/BulkCategoryFilterFields";
import { useBulkCategoryPanel } from "@/components/transactions/use-bulk-category-panel";
import { InfoTip } from "@/components/ui/InfoTip";
import type { BulkCategoryFilters } from "@/lib/transactions/bulk-category-types";

interface CategoryOption {
  id: string;
  name: string;
}

interface BulkCategoryPanelProps {
  categories: CategoryOption[];
  initialFilters: BulkCategoryFilters;
  selectedIds: string[];
}

export function BulkCategoryPanel({
  categories,
  initialFilters,
  selectedIds,
}: BulkCategoryPanelProps): React.JSX.Element {
  const panel = useBulkCategoryPanel({ initialFilters, selectedIds });

  return (
    <section className="section-card space-y-3 p-4">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-slate-800">Masowa kategoryzacja</h2>
        <InfoTip label="Masowa kategoryzacja">
          Ustaw filtry, sprawdź liczbę transakcji, wybierz kategorię i zastosuj. Max 500 na
          operację. Możesz też zaznaczyć wiersze w tabeli poniżej.
        </InfoTip>
      </div>
      <BulkCategoryFilterFields
        counterpartyContains={panel.counterpartyContains}
        mbankCategory={panel.mbankCategory}
        uncategorizedOnly={panel.uncategorizedOnly}
        onCounterpartyChange={panel.setCounterpartyContains}
        onMbankCategoryChange={panel.setMbankCategory}
        onUncategorizedChange={panel.setUncategorizedOnly}
      />
      {selectedIds.length > 0 ? (
        <p className="text-xs text-brand-700">
          Zaznaczono {String(selectedIds.length)} transakcji na liście (max 500).
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={panel.runPreview}
          disabled={panel.pending}
          className="btn-secondary text-xs"
        >
          Podgląd liczby
        </button>
        {panel.previewCount !== null ? (
          <span className="text-sm text-slate-700">
            Zostanie zaktualizowanych: <strong>{String(panel.previewCount)}</strong>
            {panel.previewCapped ? " (pierwsze 500 w operacji)" : null}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={panel.categoryId}
          onChange={(event) => {
            panel.setCategoryId(event.target.value);
          }}
          className="input-field text-xs"
          aria-label="Kategoria docelowa"
        >
          <option value="">— wybierz kategorię —</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={panel.rememberMerchant}
            onChange={(event) => {
              panel.setRememberMerchant(event.target.checked);
            }}
          />
          Zapamiętaj dla kontrahentów
        </label>
        <button
          type="button"
          onClick={panel.runBulkUpdate}
          disabled={panel.pending}
          className="btn-primary text-xs"
        >
          Zastosuj kategorię
        </button>
      </div>
      {panel.error ? <p className="alert-error text-sm">{panel.error}</p> : null}
      {panel.success ? <p className="alert-success text-sm">{panel.success}</p> : null}
    </section>
  );
}
