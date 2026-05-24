"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { useAmountTooltipLabel } from "@/components/privacy/use-amount-tooltip-label";
import type { CategorySlice } from "@/lib/analytics/category-breakdown";
import {
  categorySliceKey,
  sliceChartColor,
} from "@/lib/analytics/dashboard-extras";

interface CategoryChartProps {
  slices: CategorySlice[];
  hiddenKeys?: Set<string>;
  onToggle?: (key: string) => void;
}

export function CategoryChart({
  slices,
  hiddenKeys,
  onToggle,
}: CategoryChartProps): React.JSX.Element {
  const formatTooltip = useAmountTooltipLabel();
  const [localHidden, setLocalHidden] = useState<Set<string>>(new Set());
  const hidden = hiddenKeys ?? localHidden;

  const visibleSlices = useMemo(
    () =>
      slices.filter(
        (slice) => !hidden.has(categorySliceKey(slice.categoryId, slice.categoryName)),
      ),
    [slices, hidden],
  );

  if (slices.length === 0) {
    return <p className="text-sm text-slate-500">Brak wydatków w tym okresie.</p>;
  }

  const data = visibleSlices.map((slice, index) => ({
    key: categorySliceKey(slice.categoryId, slice.categoryName),
    name: slice.categoryName,
    value: slice.total,
    fill: sliceChartColor(slice, index),
  }));

  function toggleCategory(key: string): void {
    if (onToggle) {
      onToggle(key);
      return;
    }
    setLocalHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={95}
          />
          <Tooltip
            formatter={(value) =>
              typeof value === "number" ? formatTooltip(value) : String(value ?? "")
            }
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex flex-wrap gap-2">
        {slices.map((slice, index) => {
          const key = categorySliceKey(slice.categoryId, slice.categoryName);
          const isHidden = hidden.has(key);
          const color = sliceChartColor(slice, index);
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => {
                  toggleCategory(key);
                }}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
                  isHidden
                    ? "border-slate-200 bg-slate-50 text-slate-400 line-through"
                    : "border-calm-200 bg-white text-slate-700"
                }`}
                title={isHidden ? "Pokaż kategorię na wykresie" : "Ukryj kategorię na wykresie"}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: color, opacity: isHidden ? 0.35 : 1 }}
                />
                {slice.categoryName}
              </button>
            </li>
          );
        })}
      </ul>
      {visibleSlices.length === 0 ? (
        <p className="text-sm text-slate-500">Wszystkie kategorie są ukryte.</p>
      ) : null}
    </div>
  );
}

interface CategoryLegendControlsProps {
  slices: CategorySlice[];
  hiddenKeys: Set<string>;
  onToggle: (key: string) => void;
}

export function CategoryLegendControls({
  slices,
  hiddenKeys,
  onToggle,
}: CategoryLegendControlsProps): React.JSX.Element {
  if (slices.length === 0) {
    return <></>;
  }
  return (
    <div className="mb-2 flex flex-wrap gap-2">
      <button
        type="button"
        className="text-xs text-brand-700 hover:underline"
        onClick={() => {
          for (const slice of slices) {
            const key = categorySliceKey(slice.categoryId, slice.categoryName);
            if (hiddenKeys.has(key)) {
              onToggle(key);
            }
          }
        }}
      >
        Pokaż wszystkie
      </button>
      <button
        type="button"
        className="text-xs text-slate-500 hover:underline"
        onClick={() => {
          for (const slice of slices) {
            const key = categorySliceKey(slice.categoryId, slice.categoryName);
            if (!hiddenKeys.has(key)) {
              onToggle(key);
            }
          }
        }}
      >
        Ukryj wszystkie
      </button>
    </div>
  );
}

interface DashboardCategorySectionProps {
  slices: CategorySlice[];
  context: string;
  children: React.ReactNode;
}

export function DashboardCategorySection({
  slices,
  context,
  children,
}: DashboardCategorySectionProps): React.JSX.Element {
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

  function toggle(key: string): void {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="section-card">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="section-title">Wydatki wg kategorii</h2>
          <Link href={`/categories?context=${context}`} className="link-brand text-xs">
            Zarządzaj kategoriami
          </Link>
        </div>
        <CategoryLegendControls slices={slices} hiddenKeys={hiddenKeys} onToggle={toggle} />
        <CategoryChart slices={slices} hiddenKeys={hiddenKeys} onToggle={toggle} />
      </div>
      {children}
    </div>
  );
}
