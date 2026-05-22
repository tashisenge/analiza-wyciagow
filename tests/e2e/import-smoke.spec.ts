import path from "path";

import { expect, test } from "@playwright/test";

const fixture = path.join(process.cwd(), "tests/fixtures/mbank-sample.csv");

test("import fixture CSV — sukces bez 500", async ({ page }) => {
  await page.goto("/import");
  await page.locator('select[name="accountId"]').selectOption({ index: 0 });
  await page.locator('input[name="file"]').setInputFiles(fixture);
  const responsePromise = page.waitForResponse(
    (res) => res.url().includes("/import") && res.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Importuj" }).click();
  const response = await responsePromise;
  expect(response.status()).not.toBe(500);
  await expect(page.getByText(/Zaimportowano|pominięto/i)).toBeVisible({
    timeout: 15_000,
  });
});
