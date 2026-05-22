"use client";

import { useState } from "react";

import { AmountValue } from "@/components/privacy/AmountValue";
import type { OptimizationActionResult } from "@/server/actions/optimization";
import {
  deleteCategoryBudget,
  upsertCategoryBudget,
} from "@/server/actions/optimization";

interface CategoryOption {
  id: string;
  name: string;
}

interface BudgetRow {
  budget: {
    id: string;
    categoryId: string;
    category: { name: string };
    monthlyLimit: { toString(): string };
  };
  spent: number;
}

interface BudgetEditorProps {
  context: string;
  categories: CategoryOption[];
  budgets: BudgetRow[];
}

export function BudgetEditor({
  context,
  categories,
  budgets,
}: BudgetEditorProps): React.JSX.Element {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [limit, setLimit] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function saveBudget(): Promise<void> {
    const value = Number(limit.replace(",", "."));
    if (!categoryId || Number.isNaN(value) || value <= 0) {
      setMessage("Podaj kategorię i dodatni limit.");
      return;
    }
    setLoading(true);
    const result: OptimizationActionResult = await upsertCategoryBudget(
      categoryId,
      context,
      value,
    );
    setLoading(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    window.location.reload();
  }

  async function removeBudget(id: string): Promise<void> {
    setLoading(true);
    const result = await deleteCategoryBudget(id);
    setLoading(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    window.location.reload();
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Budżety kategorii</h2>
      <div className="flex flex-wrap gap-2">
        <select
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
          }}
          className="rounded border px-2 py-1 text-sm"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          step="0.01"
          placeholder="Limit PLN / mies."
          value={limit}
          onChange={(event) => {
            setLimit(event.target.value);
          }}
          className="w-36 rounded border px-2 py-1 text-sm"
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => void saveBudget()}
          className="btn-primary px-3 py-1"
        >
          Zapisz limit
        </button>
      </div>
      <ul className="space-y-2">
        {budgets.map((row) => {
          const max = Number(row.budget.monthlyLimit);
          const percent =
            max > 0 ? Math.min(100, Math.round((row.spent / max) * 100)) : 0;
          const over = row.spent > max;
          return (
            <li key={row.budget.id} className="rounded border p-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{row.budget.category.name}</span>
                <span className={over ? "text-red-700" : "text-slate-600"}>
                  <AmountValue>
                    {row.spent.toFixed(2)} / {max.toFixed(2)} PLN
                  </AmountValue>
                </span>
              </div>
              <div className="mt-2 h-2 rounded bg-slate-100">
                <div
                  className={`h-2 rounded ${over ? "bg-red-500" : "bg-brand-500"}`}
                  style={{ width: `${String(percent)}%` }}
                />
              </div>
              <button
                type="button"
                className="mt-2 text-xs text-slate-500 underline"
                onClick={() => void removeBudget(row.budget.id)}
              >
                Usuń limit
              </button>
            </li>
          );
        })}
      </ul>
      {message ? <p className="text-sm text-red-700">{message}</p> : null}
    </section>
  );
}
