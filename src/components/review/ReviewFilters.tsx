"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ReviewFieldFilters } from "@/components/review/ReviewFieldFilters";
import { FilterChip } from "@/components/ui/FilterChip";
import { InfoTip } from "@/components/ui/InfoTip";
import type { ContextFilter } from "@/lib/analytics/filters";
import {
  buildReviewHref,
  hasActiveReviewFilters,
  type ReviewQueueFilters,
  type ReviewReason,
} from "@/lib/review/review-queue-filters";

const CONTEXTS: { value: ContextFilter; label: string; tip: string }[] = [
  { value: "razem", label: "Razem", tip: "Firma i dom łącznie." },
  { value: "dom", label: "Dom", tip: "Tylko konto domowe." },
  { value: "firma", label: "Firma", tip: "Tylko konto firmowe." },
];

const REASON_FILTERS: { value: ReviewReason | "all"; label: string; tip: string }[] = [
  { value: "all", label: "Wszystkie rozbieżności", tip: "Pełna kolejka weryfikacji." },
  { value: "mbank_uncategorized", label: "mBank bez kategorii", tip: "Bank nie przypisał kategorii." },
  { value: "name_mismatch", label: "Różne nazwy", tip: "mBank i app mają różne kategorie." },
  { value: "app_missing", label: "Brak w app", tip: "mBank ma kategorię, app nie." },
];

interface ReviewFiltersProps {
  filters: ReviewQueueFilters;
  categories: { id: string; name: string }[];
}

export function ReviewFilters({
  filters,
  categories,
}: ReviewFiltersProps): React.JSX.Element {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [counterpartyContains, setCounterpartyContains] = useState(
    filters.counterpartyContains ?? "",
  );
  const [descriptionContains, setDescriptionContains] = useState(
    filters.descriptionContains ?? "",
  );
  const [categoryId, setCategoryId] = useState(filters.categoryId ?? "");
  const [mbankCategory, setMbankCategory] = useState(filters.mbankCategory ?? "");
  const [uncategorizedOnly, setUncategorizedOnly] = useState(
    filters.uncategorizedOnly ?? false,
  );
  const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(filters.dateTo ?? "");

  function applyFieldFilters(): void {
    const nextFilters: ReviewQueueFilters = {
      ...filters,
      counterpartyContains: counterpartyContains.trim() || undefined,
      mbankCategory: mbankCategory.trim() || undefined,
      descriptionContains: descriptionContains.trim() || undefined,
      categoryId: categoryId.trim() || undefined,
      uncategorizedOnly,
      dateFrom: dateFrom.trim() || undefined,
      dateTo: dateTo.trim() || undefined,
    };
    startTransition(() => {
      router.push(buildReviewHref(nextFilters));
    });
  }

  const activeReason = filters.reason ?? "all";
  const context = filters.context ?? "razem";

  return (
    <div className="section-card space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Filtry
          <InfoTip label="Filtry weryfikacji">
            Zawęż kolejkę przed decyzjami i weryfikacją AI.
          </InfoTip>
        </span>
        {hasActiveReviewFilters(filters) ? (
          <a href="/review" className="link-brand text-xs">
            Wyczyść filtry
          </a>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Kontekst
        </span>
        {CONTEXTS.map((ctx) => (
          <FilterChip
            key={ctx.value}
            href={buildReviewHref({ ...filters, context: ctx.value })}
            active={context === ctx.value}
            title={ctx.tip}
          >
            {ctx.label}
          </FilterChip>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Typ
        </span>
        {REASON_FILTERS.map((reason) => (
          <FilterChip
            key={reason.value}
            href={buildReviewHref({
              ...filters,
              reason: reason.value === "all" ? undefined : reason.value,
            })}
            active={activeReason === reason.value}
            title={reason.tip}
          >
            {reason.label}
          </FilterChip>
        ))}
      </div>

      <ReviewFieldFilters
        categories={categories}
        counterpartyContains={counterpartyContains}
        mbankCategory={mbankCategory}
        descriptionContains={descriptionContains}
        categoryId={categoryId}
        uncategorizedOnly={uncategorizedOnly}
        dateFrom={dateFrom}
        dateTo={dateTo}
        pending={pending}
        onCounterpartyChange={setCounterpartyContains}
        onMbankCategoryChange={setMbankCategory}
        onDescriptionChange={setDescriptionContains}
        onCategoryIdChange={setCategoryId}
        onUncategorizedChange={setUncategorizedOnly}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onApply={applyFieldFilters}
      />
    </div>
  );
}
