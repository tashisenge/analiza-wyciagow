export type PeriodPreset = "month" | "quarter" | "year";

export interface DateRangeOptions {
  year?: number;
  month?: number;
}

export interface DateRangeResult {
  label: string;
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
  isFullYear: boolean;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfQuarter(date: Date): Date {
  const quarter = Math.floor(date.getMonth() / 3) * 3;
  return new Date(date.getFullYear(), quarter, 1);
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

function endOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
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

function periodLabel(
  period: PeriodPreset,
  currentStart: Date,
  isFullYear: boolean,
): string {
  if (period === "year") {
    return isFullYear
      ? `Rok ${String(currentStart.getFullYear())}`
      : String(currentStart.getFullYear());
  }
  return currentStart.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });
}

function resolveAnchoredMonth(
  now: Date,
  year: number,
  month: number,
): Omit<DateRangeResult, "label" | "isFullYear"> {
  const anchor = new Date(year, month - 1, 1);
  const currentStart = startOfMonth(anchor);
  const isCurrentMonth =
    now.getFullYear() === year && now.getMonth() === month - 1;
  const currentEnd = isCurrentMonth ? now : endOfMonth(anchor);
  const previousAnchor = new Date(year, month - 2, 1);
  return {
    currentStart,
    currentEnd,
    previousStart: startOfMonth(previousAnchor),
    previousEnd: endOfMonth(previousAnchor),
  };
}

function resolveAnchoredYear(
  now: Date,
  year: number,
): Omit<DateRangeResult, "label"> {
  const currentStart = new Date(year, 0, 1);
  const isCurrentYear = now.getFullYear() === year;
  const currentEnd = isCurrentYear ? now : endOfYear(currentStart);
  const previousStart = new Date(year - 1, 0, 1);
  const previousEnd = endOfYear(previousStart);
  return {
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
    isFullYear: !isCurrentYear,
  };
}

function resolveDefaultRange(
  period: PeriodPreset,
  now: Date,
): Omit<DateRangeResult, "label"> {
  const currentStart = periodStartForDate(period, now);
  const previousEnd = new Date(currentStart.getTime() - 1);
  const previousStart = periodStartForDate(period, previousEnd);
  return {
    currentStart,
    currentEnd: now,
    previousStart,
    previousEnd,
    isFullYear: false,
  };
}

function resolvePresetRange(
  period: PeriodPreset,
  now: Date,
  options: DateRangeOptions,
): DateRangeResult | null {
  if (period === "month" && options.year !== undefined && options.month !== undefined) {
    const anchored = resolveAnchoredMonth(now, options.year, options.month);
    return {
      ...anchored,
      label: periodLabel("month", anchored.currentStart, false),
      isFullYear: false,
    };
  }
  if (period === "year" && options.year !== undefined) {
    const anchored = resolveAnchoredYear(now, options.year);
    return {
      ...anchored,
      label: periodLabel("year", anchored.currentStart, anchored.isFullYear),
    };
  }
  return null;
}

export function resolveDateRange(
  preset: string,
  now: Date = new Date(),
  options: DateRangeOptions = {},
): DateRangeResult {
  const period: PeriodPreset =
    preset === "quarter" || preset === "year" ? preset : "month";
  const presetRange = resolvePresetRange(period, now, options);
  if (presetRange) {
    return presetRange;
  }
  const range = resolveDefaultRange(period, now);
  return {
    ...range,
    label: periodLabel(period, range.currentStart, false),
  };
}
