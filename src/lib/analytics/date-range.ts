export type PeriodPreset = "month" | "quarter" | "year";

export interface DateRangeResult {
  label: string;
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfQuarter(date: Date): Date {
  const quarter = Math.floor(date.getMonth() / 3) * 3;
  return new Date(date.getFullYear(), quarter, 1);
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

function periodStartForDate(period: PeriodPreset, date: Date): Date {
  if (period === "quarter") {
    return startOfQuarter(date);
  }
  if (period === "year") {
    return startOfYear(date);
  }
  return startOfMonth(date);
}

function periodLabel(period: PeriodPreset, currentStart: Date): string {
  if (period === "year") {
    return String(currentStart.getFullYear());
  }
  return currentStart.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });
}

export function resolveDateRange(
  preset: string,
  now: Date = new Date(),
): DateRangeResult {
  const period: PeriodPreset =
    preset === "quarter" || preset === "year" ? preset : "month";
  const currentStart = periodStartForDate(period, now);
  const currentEnd = now;
  const previousEnd = new Date(currentStart.getTime() - 1);
  const previousStart = periodStartForDate(period, previousEnd);
  return {
    label: periodLabel(period, currentStart),
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
  };
}
