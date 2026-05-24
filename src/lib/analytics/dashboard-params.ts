import type { ContextFilter } from "@/lib/analytics/filters";

function parseYear(yearRaw?: string): number | undefined {
  if (!yearRaw) {
    return undefined;
  }
  const year = Number.parseInt(yearRaw, 10);
  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return undefined;
  }
  return year;
}

function parseMonth(monthRaw?: string): number | undefined {
  if (!monthRaw) {
    return undefined;
  }
  const month = Number.parseInt(monthRaw, 10);
  if (!Number.isFinite(month) || month < 1 || month > 12) {
    return undefined;
  }
  return month;
}

export interface DashboardSearchParams {
  context?: string;
  period?: string;
  year?: string;
  month?: string;
}

export interface ParsedDashboardParams {
  context: ContextFilter;
  period: string;
  year?: number;
  month?: number;
}

export function parseDashboardParams(
  params: DashboardSearchParams,
): ParsedDashboardParams {
  const context = (params.context ?? "razem") as ContextFilter;
  const period = params.period ?? "month";
  return {
    context,
    period,
    year: parseYear(params.year),
    month: parseMonth(params.month),
  };
}

export function buildDashboardHref(options: {
  context: string;
  period: string;
  year?: number;
  month?: number;
}): string {
  const search = new URLSearchParams({
    context: options.context,
    period: options.period,
  });
  if (options.year !== undefined) {
    search.set("year", String(options.year));
  }
  if (options.month !== undefined) {
    search.set("month", String(options.month));
  }
  return `/dashboard?${search.toString()}`;
}

export function buildPeriodHref(
  basePath: string,
  options: {
    context: string;
    period: string;
    year?: number;
    month?: number;
  },
): string {
  const search = new URLSearchParams({
    context: options.context,
    period: options.period,
  });
  if (options.year !== undefined) {
    search.set("year", String(options.year));
  }
  if (options.month !== undefined) {
    search.set("month", String(options.month));
  }
  return `${basePath}?${search.toString()}`;
}
