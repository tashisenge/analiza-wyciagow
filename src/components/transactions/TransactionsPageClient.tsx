"use client";

import { useEffect, useRef, useState } from "react";

import { BulkCategoryPanel } from "@/components/transactions/BulkCategoryPanel";
import { TransactionCounterpartyFilter } from "@/components/transactions/TransactionCounterpartyFilter";
import { TransactionDateFilters } from "@/components/transactions/TransactionDateFilters";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import type { BulkCategoryFilters } from "@/lib/transactions/bulk-category-types";
import type { TransactionSearchParams } from "@/lib/transactions/page-filters";
import { selectedIdsForListKey } from "@/lib/transactions/selected-ids-for-list-key";

interface CategoryOption {
  id: string;
  name: string;
}

interface TagOption {
  id: string;
  name: string;
  color: string;
}

interface SimilarCounts {
  byCounterparty: number;
  byCounterpartyAndAmount: number;
}

interface TransactionRow {
  id: string;
  bookedAt: Date;
  counterparty: string;
  description: string;
  mbankCategory: string;
  amount: { toString(): string };
  currency: string;
  categoryId: string | null;
  suggestedCategoryId: string;
  category: { name: string } | null;
  account: { type: string };
  similarCounts: SimilarCounts;
  isOwnAccountTransfer: boolean;
  transferPairHint: string | null;
  tags: TagOption[];
  isSubscription: boolean;
}

interface TransactionsPageClientProps {
  rows: TransactionRow[];
  categories: CategoryOption[];
  allTags: TagOption[];
  returnTo: string;
  listParams: TransactionSearchParams;
  bulkFilters: BulkCategoryFilters;
  changeCategoryAction: (formData: FormData) => Promise<void>;
}

export function TransactionsPageClient({
  rows,
  categories,
  allTags,
  returnTo,
  listParams,
  bulkFilters,
  changeCategoryAction,
}: TransactionsPageClientProps): React.JSX.Element {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const listKeyRef = useRef<string | null>(null);

  useEffect(() => {
    setSelectedIds((prev) => selectedIdsForListKey(prev, listKeyRef.current, returnTo));
    listKeyRef.current = returnTo;
  }, [returnTo]);

  function toggleId(id: string): void {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id].slice(0, 500),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <TransactionCounterpartyFilter />
        <TransactionDateFilters />
      </div>
      <BulkCategoryPanel
        categories={categories}
        initialFilters={bulkFilters}
        selectedIds={selectedIds}
      />
      <TransactionsTable
        transactions={rows}
        categories={categories}
        allTags={allTags}
        returnTo={returnTo}
        listParams={listParams}
        changeCategoryAction={changeCategoryAction}
        selectedIds={selectedIds}
        onToggleSelect={toggleId}
      />
    </div>
  );
}
