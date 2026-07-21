import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("transactions page category action", () => {
  it("captures encrypted server-loaded page ids instead of trusting form candidates", () => {
    const pageSource = readSource("src/app/(app)/transactions/page.tsx");
    const formSource = readSource("src/components/transactions/CategoryAssignForm.tsx");

    expect(pageSource).toMatch(
      /async function boundChangeCategoryAction\(formData: FormData\).*?"use server";.*?changeCategoryAction\(candidateTransactionIds, formData\)/s,
    );
    expect(pageSource).not.toContain("changeCategoryAction.bind(");
    expect(pageSource).not.toContain('formData.getAll("candidateTransactionId")');
    expect(formSource).not.toContain('name="candidateTransactionId"');
  });
});
