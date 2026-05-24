"use client";

import { useState } from "react";

import type { BulkCategoryFilters } from "@/lib/transactions/bulk-category-types";

interface BulkCategoryFormState {
  categoryId: string;
  rememberMerchant: boolean;
  counterpartyContains: string;
  mbankCategory: string;
  uncategorizedOnly: boolean;
  setCategoryId: (value: string) => void;
  setRememberMerchant: (value: boolean) => void;
  setCounterpartyContains: (value: string) => void;
  setMbankCategory: (value: string) => void;
  setUncategorizedOnly: (value: boolean) => void;
}

export function useBulkCategoryFormState(initialFilters: BulkCategoryFilters): BulkCategoryFormState {
  const [categoryId, setCategoryId] = useState("");
  const [rememberMerchant, setRememberMerchant] = useState(true);
  const [counterpartyContains, setCounterpartyContains] = useState(
    initialFilters.counterpartyContains ?? "",
  );
  const [mbankCategory, setMbankCategory] = useState(initialFilters.mbankCategory ?? "");
  const [uncategorizedOnly, setUncategorizedOnly] = useState(
    initialFilters.uncategorizedOnly ?? false,
  );

  return {
    categoryId,
    rememberMerchant,
    counterpartyContains,
    mbankCategory,
    uncategorizedOnly,
    setCategoryId,
    setRememberMerchant,
    setCounterpartyContains,
    setMbankCategory,
    setUncategorizedOnly,
  };
}
