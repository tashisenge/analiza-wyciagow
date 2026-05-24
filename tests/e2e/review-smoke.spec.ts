import { test, expect } from "@playwright/test";

test.describe("review page smoke", () => {
  test("authenticated user sees review page", async ({ page }) => {
    await page.goto("/review");
    await expect(page.getByRole("heading", { name: "Weryfikacja mBank" })).toBeVisible();
    await expect(page.getByText("Filtry")).toBeVisible();
  });
});
