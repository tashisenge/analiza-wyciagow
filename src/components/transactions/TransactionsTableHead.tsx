"use client";

import Link from "next/link";

import { buildTransactionsHref } from "@/lib/transactions/build-transactions-url";
import type { TransactionSearchParams } from "@/lib/transactions/page-filters";
import {
  buildTransactionSortHref,
  parseTransactionSort,
  type TransactionSortField,
} from "@/lib/transactions/transaction-sort";

interface TransactionsTableHeadProps {
  showSelection: boolean;
  params: TransactionSearchParams;
}

function sortIndicator(
  field: TransactionSortField,
  activeField: TransactionSortField,
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
  params,
  title,
}: {
  field: TransactionSortField;
  label: string;
  params: TransactionSearchParams;
  title: string;
}): React.JSX.Element {
  const sort = parseTransactionSort(params);
  const href = buildTransactionSortHref(params, field, buildTransactionsHref);

  return (
    <th className="px-3 py-2">
      <Link href={href} className="link-brand font-medium" title={title}>
        {label}
        {sortIndicator(field, sort.field, sort.direction)}
      </Link>
    </th>
  );
}

export function TransactionsTableHead({
  showSelection,
  params,
}: TransactionsTableHeadProps): React.JSX.Element {
  return (
    <thead className="border-b border-calm-200 bg-calm-50">
      <tr>
        {showSelection ? (
          <th className="px-3 py-2" aria-label="Zaznacz">
            ✓
          </th>
        ) : null}
        <SortableHeader
          field="date"
          label="Data"
          params={params}
          title="Sortuj po dacie"
        />
        <SortableHeader
          field="name"
          label="Operacja"
          params={params}
          title="Sortuj po nazwie kontrahenta"
        />
        <th className="px-3 py-2">Kwota</th>
        <th className="px-3 py-2">Konto</th>
        <SortableHeader
          field="similar"
          label="Podobne"
          params={params}
          title="Sortuj po liczbie podobnych transakcji (w bieżącej liście max 200)"
        />
        <th className="px-3 py-2">Kategoria</th>
        <th className="px-3 py-2">Tagi</th>
      </tr>
    </thead>
  );
}
