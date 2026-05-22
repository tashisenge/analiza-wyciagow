import { expect, type APIResponse, type Page, type Response } from "@playwright/test";

export function expectNotServerError(
  status: number,
  bodyPreview: string,
  route: string,
): void {
  expect(
    status,
    `500 Internal Server Error na ${route}\n${bodyPreview.slice(0, 500)}`,
  ).not.toBe(500);
}

export async function expectPageNotServerError(page: Page, path: string): Promise<void> {
  const response = await page.goto(path, { waitUntil: "domcontentloaded" });
  const status = response?.status() ?? 0;
  const body = response?.ok()
    ? ""
    : await page
        .locator("body")
        .innerText()
        .catch(() => "");
  expectNotServerError(status, body, path);
  expect(status, `Oczekiwano 200 na ${path}, dostało ${String(status)}`).toBe(200);
}

export async function expectResponseNotServerError(
  response: APIResponse | Response | null,
  route: string,
): Promise<void> {
  const status = response?.status() ?? 0;
  const body = response ? await response.text().catch(() => "") : "";
  expectNotServerError(status, body, route);
}
