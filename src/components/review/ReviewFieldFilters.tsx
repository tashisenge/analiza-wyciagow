"use client";

import { ReviewDateFilterFields } from "@/components/review/ReviewDateFilterFields";
import { BulkCategoryFilterFields } from "@/components/transactions/BulkCategoryFilterFields";

interface ReviewFieldFiltersProps {
  categories: { id: string; name: string }[];
  counterpartyContains: string;
  mbankCategory: string;
  descriptionContains: string;
  categoryId: string;
  uncategorizedOnly: boolean;
  dateFrom: string;
  dateTo: string;
  pending: boolean;
  onCounterpartyChange: (value: string) => void;
  onMbankCategoryChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryIdChange: (value: string) => void;
  onUncategorizedChange: (value: boolean) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onApply: () => void;
}

export function ReviewFieldFilters({
  categories,
  counterpartyContains,
  mbankCategory,
  descriptionContains,
  categoryId,
  uncategorizedOnly,
  dateFrom,
  dateTo,
  pending,
  onCounterpartyChange,
  onMbankCategoryChange,
  onDescriptionChange,
  onCategoryIdChange,
  onUncategorizedChange,
  onDateFromChange,
  onDateToChange,
  onApply,
}: ReviewFieldFiltersProps): React.JSX.Element {
  return (
    <>
      <BulkCategoryFilterFields
        counterpartyContains={counterpartyContains}
        mbankCategory={mbankCategory}
        uncategorizedOnly={uncategorizedOnly}
        onCounterpartyChange={onCounterpartyChange}
        onMbankCategoryChange={onMbankCategoryChange}
        onUncategorizedChange={onUncategorizedChange}
      />
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs text-slate-600">
          Opis zawiera
          <input
            type="search"
            value={descriptionContains}
            onChange={(event) => {
              onDescriptionChange(event.target.value);
            }}
            className="input-field ml-1 max-w-[14rem] text-xs"
            placeholder="np. przelew"
          />
        </label>
        <label className="text-xs text-slate-600">
          Kategoria app
          <select
            value={categoryId}
            onChange={(event) => {
              onCategoryIdChange(event.target.value);
            }}
            className="input-field ml-1 max-w-[14rem] text-xs"
          >
            <option value="">— wszystkie —</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ReviewDateFilterFields
        dateFrom={dateFrom}
        dateTo={dateTo}
        pending={pending}
        onDateFromChange={onDateFromChange}
        onDateToChange={onDateToChange}
        onApply={onApply}
      />
    </>
  );
}
