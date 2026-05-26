"use client";

import Link from "next/link";

import {
  buildReviewHref,
  type ReviewQueueFilters,
} from "@/lib/review/review-queue-filters";
import {
  buildReviewSortHref,
  parseReviewSort,
  type ReviewSortField,
} from "@/lib/review/review-sort";

interface ReviewQueueTableHeadProps {
  showSelection: boolean;
  filters: ReviewQueueFilters;
  page: number;
  allSelected?: boolean;
  onToggleSelectAll?: () => void;
}

function sortIndicator(
  field: ReviewSortField,
  activeField: ReviewSortField,
  direction: "asc" | "desc",
): string {
  if (field !== activeField) {
    return "";
  }
  return direction === "asc" ? " ↑" : " ↓";
}

function SortableHeader({
  field,
  label,
  filters,
  page,
  title,
}: {
  field: ReviewSortField;
  label: string;
  filters: ReviewQueueFilters;
  page: number;
  title: string;
}): React.JSX.Element {
  const sort = parseReviewSort(filters);
  const href = buildReviewSortHref({ filters, field, buildHref: buildReviewHref, page });

  return (
    <th className="px-3 py-2">
      <Link href={href} className="link-brand font-medium" title={title}>
        {label}
        {sortIndicator(field, sort.field, sort.direction)}
      </Link>
    </th>
  );
}

export function ReviewQueueTableHead({
  showSelection,
  filters,
  page,
  allSelected = false,
  onToggleSelectAll,
}: ReviewQueueTableHeadProps): React.JSX.Element {
  return (
    <thead className="border-b border-calm-200 bg-calm-50">
      <tr>
        {showSelection ? (
          <th className="px-3 py-2">
            <input
              type="checkbox"
              checked={allSelected}
              aria-label="Zaznacz wszystkie na stronie"
              onChange={() => {
                onToggleSelectAll?.();
              }}
            />
          </th>
        ) : null}
        <SortableHeader
          field="date"
          label="Data"
          filters={filters}
          page={page}
          title="Sortuj po dacie"
        />
        <SortableHeader
          field="counterparty"
          label="Operacja"
          filters={filters}
          page={page}
          title="Sortuj po nazwie kontrahenta"
        />
        <SortableHeader
          field="mbankCategory"
          label="mBank"
          filters={filters}
          page={page}
          title="Sortuj po kategorii mBank"
        />
        <SortableHeader
          field="appCategory"
          label="App"
          filters={filters}
          page={page}
          title="Sortuj po kategorii w aplikacji"
        />
        <SortableHeader
          field="amount"
          label="Kwota"
          filters={filters}
          page={page}
          title="Sortuj po kwocie"
        />
        <th className="px-3 py-2">Sugestia AI</th>
        <SortableHeader
          field="reason"
          label="Typ"
          filters={filters}
          page={page}
          title="Sortuj po typie rozbieżności"
        />
        <th className="px-3 py-2">Akcje</th>
      </tr>
    </thead>
  );
}
