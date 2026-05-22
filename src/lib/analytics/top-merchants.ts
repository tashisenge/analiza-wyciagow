export interface TxForMerchants {
  counterparty: string;
  amount: string;
}

export interface MerchantRow {
  counterparty: string;
  total: number;
  count: number;
  changePercent: number | null;
}

function sumExpensesByMerchant(
  rows: TxForMerchants[],
): Map<string, { total: number; count: number }> {
  const map = new Map<string, { total: number; count: number }>();
  for (const row of rows) {
    if (Number(row.amount) >= 0) {
      continue;
    }
    const key = row.counterparty.trim() || "Nieznany";
    const prev = map.get(key) ?? { total: 0, count: 0 };
    prev.total += Math.abs(Number(row.amount));
    prev.count += 1;
    map.set(key, prev);
  }
  return map;
}

export function topMerchants(
  current: TxForMerchants[],
  previous: TxForMerchants[],
  limit = 15,
): MerchantRow[] {
  const currentMap = sumExpensesByMerchant(current);
  const previousMap = sumExpensesByMerchant(previous);

  return [...currentMap.entries()]
    .map(([counterparty, value]) => {
      const prevTotal = previousMap.get(counterparty)?.total ?? 0;
      const changePercent =
        prevTotal === 0
          ? null
          : Math.round(((value.total - prevTotal) / prevTotal) * 1000) / 10;
      return {
        counterparty,
        total: value.total,
        count: value.count,
        changePercent,
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}
