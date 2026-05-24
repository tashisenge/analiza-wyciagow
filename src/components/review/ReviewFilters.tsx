"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { BulkCategoryFilterFields } from "@/components/transactions/BulkCategoryFilterFields";
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
  {
    value: "all",
    label: "Wszystkie rozbieżności",
    tip: "Pełna kolejka weryfikacji.",
  },
  {
    value: "mbank_uncategorized",
    label: "mBank bez kategorii",
    tip: "Bank nie przypisał kategorii.",
  },
  {
    value: "name_mismatch",
    label: "Różne nazwy",
    tip: "mBank i app mają różne kategorie.",
  },
  {
    value: "app_missing",
    label: "Brak w app",
    tip: "mBank ma kategorię, app nie.",
  },
];

interface ReviewFiltersProps {
  filters: ReviewQueueFilters;
}

export function ReviewFilters({ filters }: ReviewFiltersProps): React.JSX.Element {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [counterpartyContains, setCounterpartyContains] = useState(
    filters.counterpartyContains ?? "",
  );
  const [mbankCategory, setMbankCategory] = useState(filters.mbankCategory ?? "");
  const [uncategorizedOnly, setUncategorizedOnly] = useState(filters.uncategorizedOnly ?? false);
  const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(filters.dateTo ?? "");

  function applyFieldFilters(): void {
    const nextFilters: ReviewQueueFilters = {
      ...filters,
      counterpartyContains: counterpartyContains.trim() || undefined,
      mbankCategory: mbankCategory.trim() || undefined,
      uncategorizedOnly,
      dateFrom: dateFrom.trim() || undefined,
      dateTo: dateTo.trim() || undefined,
    };
    startTransition(() => {
      router.push(buildReviewHref(nextFilters));
    });
  }

  function reasonHref(reason: ReviewReason | "all"): string {
    return buildReviewHref({
      ...filters,
      reason: reason === "all" ? undefined : reason,
    });
  }

  const activeReason = filters.reason ?? "all";
  const context = (filters.context ?? "razem") as ContextFilter;

  return (
    <div className="section-card space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Filtry
          <InfoTip label="Filtry weryfikacji">
            Zawęż kolejkę przed decyzjami i weryfikacją AI. Filtry dat i kontrahenta wymagają
            kliknięcia „Zastosuj”.
          </InfoTip>
        </span>
        {hasActiveReviewFilters(filters) ? (
          <a href="/review" className="link-brand text-xs">
            Wyczyść filtry
          </a>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Kontekst</span>
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
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Typ</span>
        {REASON_FILTERS.map((reason) => (
          <FilterChip
            key={reason.value}
            href={reasonHref(reason.value)}
            active={activeReason === reason.value}
            title={reason.tip}
          >
            {reason.label}
          </FilterChip>
        ))}
      </div>

      <BulkCategoryFilterFields
        counterpartyContains={counterpartyContains}
        mbankCategory={mbankCategory}
        uncategorizedOnly={uncategorizedOnly}
        onCounterpartyChange={setCounterpartyContains}
        onMbankCategoryChange={setMbankCategory}
        onUncategorizedChange={setUncategorizedOnly}
      />

      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs text-slate-600">
          Od
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);
            }}
            className="input-field ml-1 text-xs"
          />
        </label>
        <label className="text-xs text-slate-600">
          Do
          <input
            type="date"
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value);
            }}
            className="input-field ml-1 text-xs"
          />
        </label>
        <button
          type="button"
          onClick={applyFieldFilters}
          disabled={pending}
          className="btn-secondary text-xs"
        >
          Zastosuj filtry
        </button>
      </div>
    </div>
  );
}
