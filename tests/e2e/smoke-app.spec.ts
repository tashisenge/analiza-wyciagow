import { test } from "@playwright/test";

import { expectPageNotServerError } from "./helpers";

const appRoutes = [
  "/dashboard",
  "/dashboard?context=firma",
  "/dashboard?context=dom",
  "/dashboard?context=razem",
  "/dashboard?period=quarter",
  "/dashboard?period=year&context=firma",
  "/transactions",
  "/transactions?uncategorized=1",
  "/review",
  "/import",
  "/categories",
  "/settings",
  "/optimize",
  "/optimize?context=dom",
] as const;

for (const path of appRoutes) {
  test(`GET ${path} (zalogowany) — 200, bez 500`, async ({ page }) => {
    await expectPageNotServerError(page, path);
  });
}
