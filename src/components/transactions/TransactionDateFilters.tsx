"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { buildTransactionsHref } from "@/lib/transactions/build-transactions-url";
import { parseTransactionSearchParams } from "@/lib/transactions/page-filters";

export function TransactionDateFilters(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") ?? "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") ?? "");

  function applyDates(): void {
    const params = parseTransactionSearchParams(
      Object.fromEntries(searchParams.entries()),
    );
    startTransition(() => {
      router.push(
        buildTransactionsHref(params, {
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        }),
      );
    });
  }

  return (
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
        onClick={applyDates}
        disabled={pending}
        className="btn-secondary text-xs"
      >
        Zastosuj daty
      </button>
    </div>
  );
}
