import { mkdir } from "fs/promises";
import { dirname } from "path";

import { test as setup, expect } from "@playwright/test";

const authFile = "playwright/.auth/demo.json";
const demoEmail = process.env["E2E_DEMO_EMAIL"] ?? "demo@analiza.local";
const demoPassword = process.env["E2E_DEMO_PASSWORD"] ?? "demo12345";

setup("logowanie demo", async ({ page }) => {
  await mkdir(dirname(authFile), { recursive: true });

  await page.goto("/login");
  await page.getByLabel("Email").fill(demoEmail);
  await page.getByLabel("Hasło").fill(demoPassword);

  const loginResponse = page.waitForResponse(
    (res) => res.url().includes("/login") && res.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Zaloguj się" }).click();

  const response = await loginResponse;
  expect(response.status(), "POST /login nie może zwracać 500").not.toBe(500);

  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.context().storageState({ path: authFile });
});
