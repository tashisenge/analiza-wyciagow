"use client";

import { useState } from "react";

import { BulkCategoryPanel } from "@/components/transactions/BulkCategoryPanel";
import { TransactionDateFilters } from "@/components/transactions/TransactionDateFilters";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import type { BulkCategoryFilters } from "@/lib/transactions/bulk-category-types";

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
  bulkFilters: BulkCategoryFilters;
  changeCategoryAction: (formData: FormData) => Promise<void>;
}

export function TransactionsPageClient({
  rows,
  categories,
  allTags,
  returnTo,
  bulkFilters,
  changeCategoryAction,
}: TransactionsPageClientProps): React.JSX.Element {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  function toggleId(id: string): void {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id].slice(0, 500),
    );
  }

  return (
    <div className="space-y-4">
      <TransactionDateFilters />
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
        changeCategoryAction={changeCategoryAction}
        selectedIds={selectedIds}
        onToggleSelect={toggleId}
      />
    </div>
  );
}
