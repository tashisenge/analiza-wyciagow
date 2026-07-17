import type { ContextFilter } from "@/lib/analytics/filters";
import { accountIdsForContext } from "@/lib/analytics/filters";
import { prisma } from "@/lib/db";
import {
  buildTransactionTableRows,
  type TransactionTableRow,
} from "@/lib/transactions/build-transaction-table-rows";
import {
  fetchTransactionsPageBundle,
  type PageTransaction,
} from "@/lib/transactions/fetch-transactions-page-bundle";
import { loadPairedOwnAccountTransferKeys } from "@/lib/transactions/load-workspace-transfer-pairs";
import type { TransactionSearchParams } from "@/lib/transactions/page-filters";
import { buildSimilarCountsByTransactionId } from "@/lib/transactions/similar-transaction-count";
import { paginateOffsetRows } from "@/lib/transactions/transaction-cursor";
import {
  parseTransactionSort,
  sortTransactionRows,
} from "@/lib/transactions/transaction-sort";

interface TransactionRow extends TransactionTableRow {
  tags: { id: string; name: string; color: string }[];
  isSubscription: boolean;
}

function mapTransactionRows(
  transactions: PageTransaction[],
  tableRows: TransactionTableRow[],
  subscriptionSet: Set<string>,
): TransactionRow[] {
  return tableRows.map((row) => {
    const source = transactions.find((tx) => tx.id === row.id);
    return {
      ...row,
      tags:
        source?.tags.map((entry) => ({
          id: entry.tag.id,
          name: entry.tag.name,
          color: entry.tag.color,
        })) ?? [],
      isSubscription: subscriptionSet.has(row.counterparty),
    };
  });
}

async function buildTransactionRows(input: {
  workspaceId: string;
  accountIds: string[];
  transactions: PageTransaction[];
  transferCategoryId: string;
  subscriptionMarkers: { counterparty: string }[];
}): Promise<TransactionRow[]> {
  const similarCounts = buildSimilarCountsByTransactionId(
    input.transactions.map((tx) => ({
      id: tx.id,
      counterparty: tx.counterparty,
      amount: tx.amount.toString(),
      currency: tx.currency,
    })),
  );
  const pairedTransferKeys = await loadPairedOwnAccountTransferKeys({
    workspaceId: input.workspaceId,
    accountIds: input.accountIds,
    anchorTransactions: input.transactions.map((tx) => ({
      id: tx.id,
      accountId: tx.accountId,
      amount: tx.amount,
      currency: tx.currency,
      bookedAt: tx.bookedAt,
    })),
  });
  const tableRows = buildTransactionTableRows({
    transactions: input.transactions,
    transferCategoryId: input.transferCategoryId,
    similarCounts,
    pairedTransferKeys,
  });
  const subscriptionSet = new Set(
    input.subscriptionMarkers.map((item) => item.counterparty),
  );
  return mapTransactionRows(input.transactions, tableRows, subscriptionSet);
}

export async function loadTransactionsPageData(
  workspaceId: string,
  context: ContextFilter,
  params: TransactionSearchParams,
): Promise<{
  rows: TransactionRow[];
  categories: { id: string; name: string }[];
  allTags: { id: string; name: string; color: string }[];
  filterCategoryName: string | undefined;
  filterTagName: string | undefined;
  nextCursor: string | null;
  prevCursor: string | null;
}> {
  const accounts = await prisma.account.findMany({ where: { workspaceId } });
  const accountIds = accountIdsForContext(accounts, context);
  const bundle = await fetchTransactionsPageBundle(workspaceId, accountIds, params);
  const {
    transactions,
    categories,
    filterCategory,
    transferCategoryId,
    allTags,
    subscriptionMarkers,
    nextCursor,
    prevCursor,
  } = bundle;

  const sort = parseTransactionSort(params);
  const sortedRows = sortTransactionRows(
    await buildTransactionRows({
      workspaceId,
      accountIds,
      transactions,
      transferCategoryId,
      subscriptionMarkers,
    }),
    sort,
  );
  const pagination =
    sort.field === "similar"
      ? paginateOffsetRows(sortedRows, params.cursor)
      : { rows: sortedRows, nextCursor, prevCursor };

  return {
    rows: pagination.rows,
    categories,
    allTags,
    filterCategoryName: filterCategory?.name ?? params.categoryName,
    filterTagName: params.tagId
      ? allTags.find((tag) => tag.id === params.tagId)?.name
      : undefined,
    nextCursor: pagination.nextCursor,
    prevCursor: pagination.prevCursor,
  };
}
