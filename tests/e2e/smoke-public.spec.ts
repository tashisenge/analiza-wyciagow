import { test } from "@playwright/test";

import { expectPageNotServerError, expectResponseNotServerError } from "./helpers";

const publicRoutes = ["/", "/login", "/register"] as const;

for (const path of publicRoutes) {
  test(`GET ${path} — bez 500`, async ({ page }) => {
    await expectPageNotServerError(page, path);
  });
}

test("POST /login — złe hasło bez 500", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nieistnieje@test.com");
  await page.getByLabel("Hasło").fill("zlehaslo12");

  const loginResponse = page.waitForResponse(
    (res) => res.url().includes("/login") && res.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Zaloguj się" }).click();

  const response = await loginResponse;
  await expectResponseNotServerError(response, "POST /login");
});

test("GET /dashboard bez sesji — przekierowanie, nie 500", async ({ request }) => {
  const response = await request.get("/dashboard", { maxRedirects: 0 });
  await expectResponseNotServerError(response, "GET /dashboard (bez sesji)");
  const status = response.status();
  if (status !== 307 && status !== 302 && status !== 303) {
    throw new Error(`Oczekiwano redirect, dostało ${String(status)}`);
  }
});
