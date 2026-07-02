"use client";

import Link from "next/link";
import { useTransition } from "react";

import { formatCategoryTransactionCount } from "@/lib/categories/category-transaction-counts";

interface CategoryRow {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
  excludeFromOptimization: boolean;
  isDiscretionary: boolean;
  transactionCount: number;
}

function DiscretionaryToggle({
  categoryId,
  isDiscretionary,
  toggleAction,
}: {
  categoryId: string;
  isDiscretionary: boolean;
  toggleAction: (categoryId: string, isDiscretionary: boolean) => Promise<void>;
}): React.JSX.Element {
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600">
      <input
        type="checkbox"
        checked={isDiscretionary}
        disabled={pending}
        onChange={(event) => {
          startTransition(() => {
            void toggleAction(categoryId, event.target.checked);
          });
        }}
        className="rounded border-slate-300"
      />
      Opcjonalny
    </label>
  );
}

function FixedExpenseToggle({
  categoryId,
  excludeFromOptimization,
  toggleAction,
}: {
  categoryId: string;
  excludeFromOptimization: boolean;
  toggleAction: (categoryId: string, exclude: boolean) => Promise<void>;
}): React.JSX.Element {
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600">
      <input
        type="checkbox"
        checked={excludeFromOptimization}
        disabled={pending}
        onChange={(event) => {
          startTransition(() => {
            void toggleAction(categoryId, event.target.checked);
          });
        }}
        className="rounded border-slate-300"
      />
      Stały wydatek
    </label>
  );
}

interface CategoryListItemProps {
  category: CategoryRow;
  deleteCategoryAction: (formData: FormData) => Promise<void>;
  toggleOptimizationExclusionAction: (
    categoryId: string,
    excludeFromOptimization: boolean,
  ) => Promise<void>;
  toggleDiscretionaryAction: (
    categoryId: string,
    isDiscretionary: boolean,
  ) => Promise<void>;
}

export function CategoryListItem({
  category,
  deleteCategoryAction,
  toggleOptimizationExclusionAction,
  toggleDiscretionaryAction,
}: CategoryListItemProps): React.JSX.Element {
  return (
    <li className="flex items-center justify-between gap-3 rounded border bg-white px-3 py-2 text-sm">
      <span className="flex min-w-0 flex-wrap items-center gap-3">
        <span>
          <span
            className="mr-2 inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          {category.name}
          {category.isDefault ? (
            <span className="ml-2 text-xs text-slate-500">(domyślna)</span>
          ) : null}
          {category.excludeFromOptimization ? (
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              stały wydatek
            </span>
          ) : null}
          {category.isDiscretionary ? (
            <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-800">
              opcjonalny
            </span>
          ) : null}
        </span>
        <Link
          href={`/transactions?categoryId=${category.id}`}
          className="rounded-full bg-calm-100 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-calm-200"
          title="Pokaż transakcje w tej kategorii"
        >
          {formatCategoryTransactionCount(category.transactionCount)}
        </Link>
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <DiscretionaryToggle
          categoryId={category.id}
          isDiscretionary={category.isDiscretionary}
          toggleAction={toggleDiscretionaryAction}
        />
        <FixedExpenseToggle
          categoryId={category.id}
          excludeFromOptimization={category.excludeFromOptimization}
          toggleAction={toggleOptimizationExclusionAction}
        />
        {!category.isDefault ? (
          <form action={deleteCategoryAction}>
            <input type="hidden" name="categoryId" value={category.id} />
            <button type="submit" className="text-xs text-red-600 hover:underline">
              Usuń
            </button>
          </form>
        ) : null}
      </span>
    </li>
  );
}
