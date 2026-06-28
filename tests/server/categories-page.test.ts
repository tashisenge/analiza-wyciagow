import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const ensureCanonicalCategories = vi.fn();
const assignMbankCategoriesForWorkspace = vi.fn();
const categoryCount = vi.fn();
const categoryFindMany = vi.fn();
const categoryRuleFindMany = vi.fn();
const loadCategoryTransactionCounts = vi.fn();

vi.stubGlobal("React", React);

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("@/components/categories/CategoriesView", () => ({
  CategoriesView: vi.fn(() => null),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { workspaceId: "ws-1" } }),
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
    ensureCanonicalCategories.mockResolvedValue(undefined);
    assignMbankCategoriesForWorkspace.mockResolvedValue(0);
    categoryCount.mockResolvedValue(99);
    categoryFindMany.mockResolvedValue([]);
    categoryRuleFindMany.mockResolvedValue([]);
    loadCategoryTransactionCounts.mockResolvedValue(new Map());
  });

  it("does not remap transaction categories while rendering", async () => {
    await CategoriesPage({ searchParams: Promise.resolve({}) });

    expect(ensureCanonicalCategories).toHaveBeenCalledWith("ws-1");
    expect(assignMbankCategoriesForWorkspace).not.toHaveBeenCalled();
  });
});
