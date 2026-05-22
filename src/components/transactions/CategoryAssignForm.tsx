"use client";

import { AmountValue } from "@/components/privacy/AmountValue";
import { InfoTip } from "@/components/ui/InfoTip";

interface CategoryOption {
  id: string;
  name: string;
}

interface SimilarCounts {
  byCounterparty: number;
  byCounterpartyAndAmount: number;
}

interface CategoryAssignFormProps {
  transactionId: string;
  categories: CategoryOption[];
  defaultCategoryId: string;
  similarCounts: SimilarCounts;
  counterparty: string;
  amountLabel: string;
  isOwnAccountTransfer: boolean;
  hasCategory: boolean;
  action: (formData: FormData) => Promise<void>;
  returnTo?: string;
}

export function CategoryAssignForm({
  transactionId,
  categories,
  defaultCategoryId,
  similarCounts,
  counterparty,
  amountLabel,
  isOwnAccountTransfer,
  hasCategory,
  action,
  returnTo = "/transactions",
}: CategoryAssignFormProps): React.JSX.Element {
  const showSimilar =
    similarCounts.byCounterparty > 0 &&
    counterparty.trim().length > 0 &&
    !isOwnAccountTransfer;
  const showAmountMatch =
    showSimilar &&
    similarCounts.byCounterpartyAndAmount > 0 &&
    similarCounts.byCounterpartyAndAmount < similarCounts.byCounterparty;

  return (
    <form action={action} className="space-y-1.5">
      <input type="hidden" name="transactionId" value={transactionId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <select
        name="categoryId"
        defaultValue={defaultCategoryId}
        className="input-field text-xs"
        aria-label="Kategoria"
        onChange={(event) => {
          event.currentTarget.form?.requestSubmit();
        }}
      >
        <option value="">— wybierz —</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      {showSimilar ? (
        <label className="flex items-center gap-1 text-xs text-slate-600">
          <input type="checkbox" name="applyToSimilar" defaultChecked />
          Do {String(similarCounts.byCounterparty)} podobnych (kontrahent)
          <InfoTip label="Masowa kategoryzacja">
            Ustaw tę samą kategorię dla wszystkich transakcji tego kontrahenta na liście.
          </InfoTip>
        </label>
      ) : null}
      {showAmountMatch ? (
        <label className="flex items-center gap-1 text-xs text-slate-600">
          <input type="checkbox" name="matchSameAmount" />
          Tylko {String(similarCounts.byCounterpartyAndAmount)} z kwotą{" "}
          <AmountValue>{amountLabel}</AmountValue>
          <InfoTip label="Filtr kwoty">
            Zawęż masowe przypisanie do transakcji o identycznej kwocie.
          </InfoTip>
        </label>
      ) : null}
      {showSimilar &&
      similarCounts.byCounterpartyAndAmount === similarCounts.byCounterparty ? (
        <p className="text-xs text-slate-500">
          Wszystkie podobne mają tę samą kwotę (<AmountValue>{amountLabel}</AmountValue>)
        </p>
      ) : null}
      {showSimilar ? (
        <label className="flex items-center gap-1 text-xs text-slate-600">
          <input type="checkbox" name="createRule" />
          Reguła: „{counterparty.trim().slice(0, 24)}”
          <InfoTip label="Reguła kategorii">
            Przyszłe importy z tym kontrahentem dostaną tę kategorię automatycznie.
          </InfoTip>
        </label>
      ) : null}
      {hasCategory ? (
        <button
          type="submit"
          name="categoryId"
          value=""
          className="text-xs font-medium text-red-700 underline decoration-red-200 hover:text-red-800"
        >
          Usuń kategorię
        </button>
      ) : null}
    </form>
  );
}
