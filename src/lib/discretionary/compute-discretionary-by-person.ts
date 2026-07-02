import type { MappedDiscretionaryTx } from "@/lib/discretionary/aggregate-discretionary-merchants";
import { isDiscretionaryExpense } from "@/lib/discretionary/is-discretionary-transaction";
import { discretionaryAmountPln } from "@/lib/discretionary/map-transactions-for-discretionary";
import type { DiscretionaryPersonRow } from "@/lib/discretionary/types";
import { PERSON_TAG_NAMES } from "@/lib/tags/ensure-person-tags";

const UNASSIGNED_LABEL = "Bez tagu";

function personLabel(tagNames: string[], personTagNames: readonly string[]): string {
  for (const name of personTagNames) {
    if (tagNames.includes(name)) {
      return name;
    }
  }
  return UNASSIGNED_LABEL;
}

function accumulateByPerson(
  transactions: MappedDiscretionaryTx[],
  personTagNames: readonly string[],
): Map<string, { totalPln: number; transactionCount: number }> {
  const totals = new Map<string, { totalPln: number; transactionCount: number }>();
  for (const tx of transactions) {
    if (!isDiscretionaryExpense(tx)) {
      continue;
    }
    const label = personLabel(tx.tagNames, personTagNames);
    const current = totals.get(label) ?? { totalPln: 0, transactionCount: 0 };
    totals.set(label, {
      totalPln: current.totalPln + discretionaryAmountPln(tx.amount),
      transactionCount: current.transactionCount + 1,
    });
  }
  return totals;
}

function sharePercent(value: number, total: number): number | null {
  return total > 0 ? Math.round((value / total) * 1000) / 10 : null;
}

function personRow(
  name: string,
  row: { totalPln: number; transactionCount: number },
  discretionaryTotal: number,
): DiscretionaryPersonRow {
  return {
    name,
    totalPln: row.totalPln,
    transactionCount: row.transactionCount,
    shareOfDiscretionaryPercent: sharePercent(row.totalPln, discretionaryTotal),
  };
}

export function computeDiscretionaryByPerson(
  transactions: MappedDiscretionaryTx[],
  personTagNames: readonly string[] = PERSON_TAG_NAMES,
): DiscretionaryPersonRow[] {
  const totals = accumulateByPerson(transactions, personTagNames);
  const discretionaryTotal = [...totals.values()].reduce(
    (sum, row) => sum + row.totalPln,
    0,
  );

  return [...personTagNames, UNASSIGNED_LABEL]
    .filter((label) => totals.has(label))
    .map((name) => {
      const row = totals.get(name);
      return row ? personRow(name, row, discretionaryTotal) : null;
    })
    .filter((row): row is DiscretionaryPersonRow => row !== null);
}
