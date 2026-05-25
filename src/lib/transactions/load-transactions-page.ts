import type { Prisma } from "@prisma/client";

import type { ContextFilter } from "@/lib/analytics/filters";
import { accountIdsForContext } from "@/lib/analytics/filters";
import { ensureTransferCategory } from "@/lib/categories/ensure-transfer-category";
import { prisma } from "@/lib/db";
import {
  buildTransactionTableRows,
  type TransactionTableRow,
} from "@/lib/transactions/build-transaction-table-rows";
import { loadPairedOwnAccountTransferKeys } from "@/lib/transactions/load-workspace-transfer-pairs";
import { buildTransactionsWhere } from "@/lib/transactions/build-transactions-where";
import type { TransactionSearchParams } from "@/lib/transactions/page-filters";
import { buildSimilarCountsByTransactionId } from "@/lib/transactions/similar-transaction-count";

const transactionPageInclude = {
  category: true,
  account: true,
  tags: { include: { tag: true } },
} satisfies Prisma.TransactionInclude;

type PageTransaction = Prisma.TransactionGetPayload<{
  include: typeof transactionPageInclude;
}>;

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

async function fetchTransactionsBundle(
  workspaceId: string,
  accountIds: string[],
  params: TransactionSearchParams,
): Promise<{
  transactions: PageTransaction[];
  categories: { id: string; name: string }[];
  filterCategory: { name: string } | null;
  transferCategoryId: string;
  allTags: { id: string; name: string; color: string }[];
  subscriptionMarkers: { counterparty: string }[];
}> {
  const [
    transactions,
    categories,
    filterCategory,
    transferCategoryId,
    allTags,
    subscriptionMarkers,
  ] = await Promise.all([
    prisma.transaction.findMany({
      where: buildTransactionsWhere(workspaceId, accountIds, params),
      orderBy: { bookedAt: "desc" },
      take: 200,
      include: transactionPageInclude,
    }),
    prisma.category.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
    params.categoryId
      ? prisma.category.findFirst({
          where: { id: params.categoryId, workspaceId },
          select: { name: true },
        })
      : null,
    ensureTransferCategory(workspaceId),
    prisma.tag.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
    prisma.subscriptionMarker.findMany({
      where: { workspaceId },
      select: { counterparty: true },
    }),
  ]);
  return {
    transactions,
    categories,
    filterCategory,
    transferCategoryId,
    allTags,
    subscriptionMarkers,
  };
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
}> {
  const accounts = await prisma.account.findMany({ where: { workspaceId } });
  const accountIds = accountIdsForContext(accounts, context);
  const bundle = await fetchTransactionsBundle(workspaceId, accountIds, params);
  const {
    transactions,
    categories,
    filterCategory,
    transferCategoryId,
    allTags,
    subscriptionMarkers,
  } = bundle;

  const rows = await buildTransactionRows({
    workspaceId,
    accountIds,
    transactions,
    transferCategoryId,
    subscriptionMarkers,
  });

  return {
    rows,
    categories,
    allTags,
    filterCategoryName: filterCategory?.name ?? params.categoryName,
    filterTagName: params.tagId
      ? allTags.find((tag) => tag.id === params.tagId)?.name
      : undefined,
  };
}
