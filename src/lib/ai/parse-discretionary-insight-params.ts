import {
  type DiscretionaryInsightRequestParams,
} from "@/lib/ai/discretionary-insight-types";
import { resolveDateRange } from "@/lib/analytics/date-range";
import type { ContextFilter } from "@/lib/analytics/filters";

export function parseDiscretionaryInsightParams(params: DiscretionaryInsightRequestParams): {
  context: ContextFilter;
  range: ReturnType<typeof resolveDateRange>;
} {
  const context: ContextFilter =
    params.context === "firma" || params.context === "dom" ? params.context : "razem";
  const period =
    params.period === "month" || params.period === "year" || params.period === "all"
      ? params.period
      : "month";
  const now = new Date();
  const year = params.year > 2000 ? params.year : now.getFullYear();
  const month = params.month >= 1 && params.month <= 12 ? params.month : now.getMonth() + 1;
  const range = resolveDateRange(period, now, {
    year: period === "month" || period === "year" ? year : undefined,
    month: period === "month" ? month : undefined,
  });
  return { context, range };
}
