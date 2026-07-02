"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { buildTransactionsHref } from "@/lib/transactions/build-transactions-url";
import { parseTransactionSearchParams } from "@/lib/transactions/page-filters";

export function TransactionCounterpartyFilter(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [counterparty, setCounterparty] = useState(
    searchParams.get("counterparty") ?? "",
  );

  function applyFilter(): void {
    const params = parseTransactionSearchParams(
      Object.fromEntries(searchParams.entries()),
    );
    startTransition(() => {
      router.push(
        buildTransactionsHref(params, {
          counterparty: counterparty.trim() || undefined,
        }),
      );
    });
  }

  function clearFilter(): void {
    setCounterparty("");
    const params = parseTransactionSearchParams(
      Object.fromEntries(searchParams.entries()),
    );
    startTransition(() => {
      router.push(buildTransactionsHref(params, { counterparty: undefined }));
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="text-xs text-slate-600">
        Nazwa / kontrahent
        <input
          type="search"
          value={counterparty}
          onChange={(event) => {
            setCounterparty(event.target.value);
          }}
          placeholder="np. LIDL, Netflix"
          className="input-field ml-1 max-w-[14rem] text-xs"
          aria-label="Filtruj po nazwie kontrahenta"
        />
      </label>
      <button
        type="button"
        onClick={applyFilter}
        disabled={pending}
        className="btn-secondary text-xs"
      >
        Filtruj
      </button>
      {searchParams.get("counterparty") ? (
        <button
          type="button"
          onClick={clearFilter}
          disabled={pending}
          className="text-xs text-slate-600 hover:underline"
        >
          Wyczyść
        </button>
      ) : null}
    </div>
  );
}
