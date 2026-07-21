import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("transactions page category action", () => {
  it("binds server-loaded page ids instead of trusting hidden form candidates", () => {
    const pageSource = readSource("src/app/(app)/transactions/page.tsx");
    const formSource = readSource("src/components/transactions/CategoryAssignForm.tsx");

    expect(pageSource).toContain(
      "changeCategoryAction.bind(null, candidateTransactionIds)",
    );
    expect(pageSource).not.toContain('formData.getAll("candidateTransactionId")');
    expect(formSource).not.toContain('name="candidateTransactionId"');
  });
});
