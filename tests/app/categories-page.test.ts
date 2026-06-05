import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const categoryCount = vi.fn();
const categoryFindMany = vi.fn();
const categoryRuleFindMany = vi.fn();
const ensureCanonicalCategories = vi.fn();
const loadCategoryTransactionCounts = vi.fn();
const assignMbankCategoriesForWorkspace = vi.fn();

vi.stubGlobal("React", React);

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));

vi.mock("@/components/categories/CategoriesView", () => ({
  CategoriesView: vi.fn(() => null),
}));

vi.mock("@/lib/auth", () => ({
  auth: (...args: unknown[]) => auth(...args),
}));

vi.mock("@/lib/categories/category-transaction-counts", () => ({
  loadCategoryTransactionCounts: (...args: unknown[]) =>
    loadCategoryTransactionCounts(...args),
}));

vi.mock("@/lib/categories/ensure-canonical-categories", () => ({
  ensureCanonicalCategories: (...args: unknown[]) => ensureCanonicalCategories(...args),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    category: {
      count: (...args: unknown[]) => categoryCount(...args),
      findMany: (...args: unknown[]) => categoryFindMany(...args),
    },
    categoryRule: {
      findMany: (...args: unknown[]) => categoryRuleFindMany(...args),
    },
  },
}));

vi.mock("@/lib/mbank/sync-categories", () => ({
  assignMbankCategoriesForWorkspace: (...args: unknown[]) =>
    assignMbankCategoriesForWorkspace(...args),
}));

vi.mock("@/server/actions/categories", () => ({
  createCategory: vi.fn(),
  createRule: vi.fn(),
  deleteCategory: vi.fn(),
  deleteRule: vi.fn(),
  setCategoryOptimizationExclusion: vi.fn(),
}));

vi.mock("@/server/actions/discretionary", () => ({
  setCategoryDiscretionary: vi.fn(),
}));

import CategoriesPage from "@/app/(app)/categories/page";

describe("CategoriesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { workspaceId: "ws-1" } });
    categoryCount.mockResolvedValue(20);
    categoryFindMany.mockResolvedValue([]);
    categoryRuleFindMany.mockResolvedValue([]);
    ensureCanonicalCategories.mockResolvedValue(undefined);
    loadCategoryTransactionCounts.mockResolvedValue(new Map());
    assignMbankCategoriesForWorkspace.mockResolvedValue(5);
  });

  it("does not reassign transactions as a side effect of rendering the page", async () => {
    await CategoriesPage({ searchParams: Promise.resolve({}) });

    expect(ensureCanonicalCategories).toHaveBeenCalledWith("ws-1");
    expect(categoryCount).not.toHaveBeenCalled();
    expect(assignMbankCategoriesForWorkspace).not.toHaveBeenCalled();
  });
});
