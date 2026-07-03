import type { TransactionSearchParams } from "@/lib/transactions/page-filters";
import { TRANSACTION_PAGE_SIZE } from "@/lib/transactions/transaction-cursor";

interface TransactionsPaginationProps {
  params: TransactionSearchParams;
  rowCount: number;
  nextCursor: string | null;
  prevCursor: string | null;
  buildHref: (
    current: TransactionSearchParams,
    patch: Partial<Record<keyof TransactionSearchParams, string | undefined>>,
  ) => string;
}

export function TransactionsPagination({
  params,
  rowCount,
  nextCursor,
  prevCursor,
  buildHref,
}: TransactionsPaginationProps): React.JSX.Element | null {
  if (!params.cursor && rowCount < TRANSACTION_PAGE_SIZE) {
    return null;
  }

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-2 text-sm"
      aria-label="Paginacja transakcji"
    >
      <p className="text-slate-600">
        Pokazano <strong>{String(rowCount)}</strong> transakcji
        {rowCount >= TRANSACTION_PAGE_SIZE ? "+" : ""} (po {String(TRANSACTION_PAGE_SIZE)}{" "}
        na stronę)
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {prevCursor ? (
          <a
            href={buildHref(params, { cursor: prevCursor })}
            className="link-brand"
            rel="prev"
          >
            ← Poprzednia
          </a>
        ) : params.cursor ? (
          <a
            href={buildHref(params, { cursor: undefined })}
            className="link-brand"
            rel="prev"
          >
            ← Pierwsza strona
          </a>
        ) : null}
        {nextCursor ? (
          <a
            href={buildHref(params, { cursor: nextCursor })}
            className="link-brand"
            rel="next"
          >
            Następna →
          </a>
        ) : null}
      </div>
    </nav>
  );
}
