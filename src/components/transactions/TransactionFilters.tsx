"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { FilterChip } from "@/components/ui/FilterChip";
import { InfoTip } from "@/components/ui/InfoTip";
import { PERSON_TAG_NAMES } from "@/lib/tags/ensure-person-tags";
import { buildTransactionsHref } from "@/lib/transactions/build-transactions-url";
import type { TransactionSearchParams } from "@/lib/transactions/page-filters";

interface CategoryOption {
  id: string;
  name: string;
}

interface TagOption {
  id: string;
  name: string;
}

interface TransactionFiltersProps {
  active: string;
  params: TransactionSearchParams;
  categories: CategoryOption[];
  tags: TagOption[];
}

const QUICK_FILTERS = [
  { key: "all", label: "Wszystkie", tip: "Pełna lista (max 200)." },
  {
    key: "uncategorized",
    label: "Bez kategorii",
    tip: "Tylko transakcje bez przypisanej kategorii.",
  },
  {
    key: "discretionary",
    label: "Opcjonalne",
    tip: "Tylko kategorie oznaczone jako opcjonalne.",
  },
  { key: "firma", label: "Firma", tip: "Konto firmowe." },
  { key: "dom", label: "Dom", tip: "Konto domowe." },
] as const;

function quickFilterHref(
  key: (typeof QUICK_FILTERS)[number]["key"],
  params: TransactionSearchParams,
): string {
  switch (key) {
    case "all":
      return "/transactions";
    case "uncategorized":
      return buildTransactionsHref(params, {
        uncategorized: "1",
        categoryId: undefined,
        categoryName: undefined,
        discretionary: undefined,
        tagId: undefined,
      });
    case "discretionary":
      return buildTransactionsHref(params, {
        discretionary: "1",
        uncategorized: undefined,
        categoryId: undefined,
        categoryName: undefined,
        tagId: undefined,
      });
    case "firma":
      return buildTransactionsHref(params, {
        context: "firma",
        uncategorized: undefined,
        discretionary: undefined,
      });
    case "dom":
      return buildTransactionsHref(params, {
        context: "dom",
        uncategorized: undefined,
        discretionary: undefined,
      });
  }
}

function tagFilterHref(params: TransactionSearchParams, tagId: string): string {
  return buildTransactionsHref(params, {
    tagId,
    uncategorized: undefined,
    categoryId: undefined,
    categoryName: undefined,
  });
}

export function TransactionFilters({
  active,
  params,
  categories,
  tags,
}: TransactionFiltersProps): React.JSX.Element {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const selectedCategoryId = params.categoryId ?? "";
  const personTags = PERSON_TAG_NAMES.map((name) => tags.find((tag) => tag.name === name)).filter(
    (tag): tag is TagOption => tag !== undefined,
  );

  function onCategoryChange(categoryId: string): void {
    startTransition(() => {
      if (!categoryId) {
        router.push(
          buildTransactionsHref(params, {
            categoryId: undefined,
            categoryName: undefined,
          }),
        );
        return;
      }
      router.push(
        buildTransactionsHref(params, {
          categoryId,
          categoryName: undefined,
          uncategorized: undefined,
        }),
      );
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Filtr
        <InfoTip label="Filtry listy">
          Szybkie filtry, tagi osób (Adam / Żona) i kategorie. Parametry dat i kontekstu zostają w
          URL.
        </InfoTip>
      </span>
      {QUICK_FILTERS.map((filter) => (
        <FilterChip
          key={filter.key}
          href={quickFilterHref(filter.key, params)}
          active={active === filter.key}
          title={filter.tip}
        >
          {filter.label}
        </FilterChip>
      ))}
      {personTags.map((tag) => (
        <FilterChip
          key={tag.id}
          href={tagFilterHref(params, tag.id)}
          active={params.tagId === tag.id}
          title={`Transakcje oznaczone tagiem ${tag.name}`}
        >
          {tag.name}
        </FilterChip>
      ))}
      <label className="flex items-center gap-1.5 text-xs text-slate-600">
        Kategoria
        <select
          value={selectedCategoryId}
          onChange={(event) => {
            onCategoryChange(event.target.value);
          }}
          disabled={pending}
          className="input-field max-w-[14rem] text-xs"
          aria-label="Filtruj po kategorii"
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
  );
}
