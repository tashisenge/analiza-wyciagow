import type { Prisma } from "@prisma/client";

import { ensureTransferCategory } from "@/lib/categories/ensure-transfer-category";
import { prisma } from "@/lib/db";
import { buildTransactionsWhere } from "@/lib/transactions/build-transactions-where";
import type { TransactionSearchParams } from "@/lib/transactions/page-filters";
import {
  buildKeysetCursorWhere,
  cursorModeForSort,
  encodeTransactionCursor,
  nextPageCursor,
  resolvePaginationCursor,
  TRANSACTION_PAGE_SIZE,
  TRANSACTION_SIMILAR_SORT_LIMIT,
  type TransactionCursor,
} from "@/lib/transactions/transaction-cursor";
import {
  buildTransactionPageOrderBy,
  parseTransactionSort,
  type TransactionSortState,
} from "@/lib/transactions/transaction-sort";

const transactionPageInclude = {
  category: true,
  account: true,
  tags: { include: { tag: true } },
} satisfies Prisma.TransactionInclude;

export type PageTransaction = Prisma.TransactionGetPayload<{
  include: typeof transactionPageInclude;
}>;

export interface TransactionsPageBundle {
  transactions: PageTransaction[];
  categories: { id: string; name: string }[];
  filterCategory: { name: string } | null;
  transferCategoryId: string;
  allTags: { id: string; name: string; color: string }[];
  subscriptionMarkers: { counterparty: string }[];
  nextCursor: string | null;
  prevCursor: string | null;
}

function buildCursorWhere(
  baseWhere: Prisma.TransactionWhereInput,
  cursor: TransactionCursor | null,
  sort: TransactionSortState,
): Prisma.TransactionWhereInput {
  if (!cursor || cursor.kind === "offset") {
    return baseWhere;
  }
  const keysetWhere = buildKeysetCursorWhere(cursor, sort.direction);
  return {
    AND: [baseWhere, keysetWhere],
  };
}

function prevPageCursor(
  current: TransactionCursor | null,
  sort: TransactionSortState,
): string | null {
  if (!current || cursorModeForSort(sort) !== "offset" || current.kind !== "offset") {
    return null;
  }
  const prevSkip = current.skip - TRANSACTION_PAGE_SIZE;
  if (prevSkip <= 0) {
    return null;
  }
  return encodeTransactionCursor({ kind: "offset", skip: prevSkip });
}

async function fetchTransactionsPage(
  workspaceId: string,
  accountIds: string[],
  params: TransactionSearchParams,
): Promise<PageTransaction[]> {
  const sort = parseTransactionSort(params);
  const baseWhere = buildTransactionsWhere(workspaceId, accountIds, params);
  const deferPagination = sort.field === "similar";
  const cursor = deferPagination ? null : resolvePaginationCursor(params.cursor, sort);
  const where = buildCursorWhere(baseWhere, cursor, sort);
  const skip = cursor?.kind === "offset" ? cursor.skip : 0;

  return prisma.transaction.findMany({
    where,
    orderBy: buildTransactionPageOrderBy(sort),
    take: deferPagination ? TRANSACTION_SIMILAR_SORT_LIMIT : TRANSACTION_PAGE_SIZE + 1,
    skip,
    include: transactionPageInclude,
  });
}

export async function fetchTransactionsPageBundle(
  workspaceId: string,
  accountIds: string[],
  params: TransactionSearchParams,
): Promise<TransactionsPageBundle> {
  const sort = parseTransactionSort(params);
  const cursor = resolvePaginationCursor(params.cursor, sort);
  const [
    rawTransactions,
    categories,
    filterCategory,
    transferCategoryId,
    allTags,
    subscriptionMarkers,
  ] = await Promise.all([
    fetchTransactionsPage(workspaceId, accountIds, params),
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

  const hasMore =
    sort.field !== "similar" && rawTransactions.length > TRANSACTION_PAGE_SIZE;
  const transactions =
    sort.field === "similar" || !hasMore
      ? rawTransactions
      : rawTransactions.slice(0, TRANSACTION_PAGE_SIZE);

  return {
    transactions,
    categories,
    filterCategory,
    transferCategoryId,
    allTags,
    subscriptionMarkers,
    nextCursor: hasMore ? nextPageCursor(transactions, sort, cursor) : null,
    prevCursor: sort.field === "similar" ? null : prevPageCursor(cursor, sort),
  };
}
