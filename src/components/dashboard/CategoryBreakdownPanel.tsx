"use client";

import Link from "next/link";
import { useState } from "react";

import { AmountValue } from "@/components/privacy/AmountValue";
import type { CategoryTransactionGroup } from "@/lib/analytics/category-transactions";

interface CategoryBreakdownPanelProps {
  groups: CategoryTransactionGroup[];
  context: string;
}

function transactionsFilterHref(
  group: CategoryTransactionGroup,
  context: string,
): string {
  const params = new URLSearchParams({ context });
  if (group.categoryId) {
    params.set("categoryId", group.categoryId);
  } else {
    params.set("categoryName", group.categoryName);
  }
  return `/transactions?${params.toString()}`;
}

export function CategoryBreakdownPanel({
  groups,
  context,
}: CategoryBreakdownPanelProps): React.JSX.Element {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  if (groups.length === 0) {
    return <p className="text-sm text-slate-500">Brak wydatków w tym okresie.</p>;
  }

  const sum = groups.reduce((acc, group) => acc + group.total, 0) || 1;

  return (
    <ul className="space-y-2">
      {groups.map((group) => {
        const percent = Math.round((group.total / sum) * 1000) / 10;
        const expanded = expandedKey === group.categoryKey;
        return (
          <li key={group.categoryKey} className="rounded border bg-white text-sm">
            <button
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-50"
              onClick={() => {
                setExpandedKey(expanded ? null : group.categoryKey);
              }}
            >
              <span className="font-medium">{group.categoryName}</span>
              <span className="text-slate-600">
                <AmountValue>{group.total.toFixed(2)} PLN</AmountValue> ({String(percent)}
                %)
                <span className="ml-2 text-indigo-600">{expanded ? "▲" : "▼"}</span>
              </span>
            </button>
            {expanded ? (
              <div className="border-t px-3 py-2">
                <ul className="space-y-1 text-xs text-slate-700">
                  {group.transactions.map((tx) => (
                    <li key={tx.id} className="flex justify-between gap-2">
                      <span>
                        {tx.bookedAt} · {tx.counterparty}
                      </span>
                      <span className="whitespace-nowrap font-medium text-red-700">
                        <AmountValue>
                          {Math.abs(Number(tx.amount)).toFixed(2)} PLN
                        </AmountValue>
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={transactionsFilterHref(group, context)}
                  className="mt-2 inline-block text-xs font-medium text-indigo-600 hover:underline"
                >
                  Wszystkie transakcje w tej kategorii →
                </Link>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
