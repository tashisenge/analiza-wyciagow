import { describe, expect, it } from "vitest";

import { buildCategoryChangeRedirectUrl } from "@/lib/transactions/build-category-change-redirect";

describe("buildCategoryChangeRedirectUrl", () => {
  it("appends encoded error to return URL", () => {
    const url = buildCategoryChangeRedirectUrl(
      "/transactions?context=dom",
      { ok: false, error: "Nieprawidłowa kategoria" },
      "cat-1",
    );
    expect(url).toContain("context=dom");
    expect(url).toContain("error=Nieprawid%C5%82owa%20kategoria");
  });

  it("appends success message when multiple transactions updated", () => {
    const url = buildCategoryChangeRedirectUrl(
      "/transactions",
      { ok: true, updatedCount: 3 },
      "cat-1",
    );
    expect(url).toContain("msg=");
    expect(decodeURIComponent(url.split("msg=")[1] ?? "")).toContain("3 transakcji");
  });

  it("returns plain returnTo on single successful update", () => {
    const url = buildCategoryChangeRedirectUrl(
      "/transactions?categoryId=cat-1",
      { ok: true, updatedCount: 1 },
      "cat-1",
    );
    expect(url).toBe("/transactions?categoryId=cat-1");
  });

  it("uses cleared message when category removed from many rows", () => {
    const url = buildCategoryChangeRedirectUrl(
      "/transactions",
      { ok: true, updatedCount: 2 },
      "",
    );
    expect(decodeURIComponent(url.split("msg=")[1] ?? "")).toContain(
      "Usunięto kategorię",
    );
  });
});
