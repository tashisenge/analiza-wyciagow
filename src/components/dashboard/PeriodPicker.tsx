"use client";

import { useRouter } from "next/navigation";

import { buildDashboardHref, buildPeriodHref } from "@/lib/analytics/dashboard-params";

function pickerHref(
  basePath: string,
  options: { context: string; period: string; year: number; month?: number },
): string {
  return basePath === "/dashboard"
    ? buildDashboardHref(options)
    : buildPeriodHref(basePath, options);
}

interface MonthPickerProps {
  context: string;
  period: string;
  year: number;
  month: number;
  basePath?: string;
}

export function MonthPicker({
  context,
  period,
  year,
  month,
  basePath = "/dashboard",
}: MonthPickerProps): React.JSX.Element {
  const router = useRouter();
  const value = `${String(year)}-${String(month).padStart(2, "0")}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label
        htmlFor="dashboard-month"
        className="text-xs font-medium uppercase tracking-wide text-slate-500"
      >
        Miesiąc
      </label>
      <input
        id="dashboard-month"
        type="month"
        value={value}
        className="rounded-lg border border-calm-200 bg-white px-2 py-1 text-sm text-slate-800"
        onChange={(event) => {
          const [nextYear, nextMonth] = event.target.value.split("-");
          if (!nextYear || !nextMonth) {
            return;
          }
          router.push(
            pickerHref(basePath, {
              context,
              period,
              year: Number.parseInt(nextYear, 10),
              month: Number.parseInt(nextMonth, 10),
            }),
          );
        }}
      />
    </div>
  );
}

interface YearPickerProps {
  context: string;
  period: string;
  year: number;
  basePath?: string;
}

export function YearPicker({
  context,
  period,
  year,
  basePath = "/dashboard",
}: YearPickerProps): React.JSX.Element {
  const router = useRouter();
  const nowYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, index) => nowYear - index);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label
        htmlFor="dashboard-year"
        className="text-xs font-medium uppercase tracking-wide text-slate-500"
      >
        Rok
      </label>
      <select
        id="dashboard-year"
        value={String(year)}
        className="rounded-lg border border-calm-200 bg-white px-2 py-1 text-sm text-slate-800"
        onChange={(event) => {
          router.push(
            pickerHref(basePath, {
              context,
              period,
              year: Number.parseInt(event.target.value, 10),
            }),
          );
        }}
      >
        {years.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}
