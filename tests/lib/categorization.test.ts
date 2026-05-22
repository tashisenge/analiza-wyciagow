import { describe, expect, it } from "vitest";

import { matchCategoryRule } from "@/lib/categorization/apply-rules";
import { categorizeTransaction } from "@/lib/categorization/categorize-transaction";

describe("categorization", () => {
  const rules = [
    {
      id: "1",
      categoryId: "cat-food",
      matchField: "counterparty",
      matchContains: "BIEDRONKA",
      priority: 10,
    },
    {
      id: "2",
      categoryId: "cat-other",
      matchField: "description",
      matchContains: "ZUS",
      priority: 5,
    },
  ];

  it("matches highest priority rule on counterparty", () => {
    const categoryId = matchCategoryRule(
      { description: "Zakup", counterparty: "BIEDRONKA SP." },
      rules,
    );
    expect(categoryId).toBe("cat-food");
  });

  it("uses merchant memory when no rule matches", () => {
    const categoryId = categorizeTransaction(
      { description: "Płatność", counterparty: "LIDL" },
      [],
      [{ counterparty: "LIDL", categoryId: "cat-food" }],
    );
    expect(categoryId).toBe("cat-food");
  });
});
