import { describe, expect, it } from "vitest";

import { buildAiUncategorizedWhere } from "@/lib/ai/ai-target-transactions";

describe("buildAiUncategorizedWhere", () => {
  it("targets null categoryId and Bez kategorii bucket ids only", () => {
    expect(buildAiUncategorizedWhere("ws-1", ["bez-1", "bez-2"])).toEqual({
      workspaceId: "ws-1",
      OR: [{ categoryId: null }, { categoryId: { in: ["bez-1", "bez-2"] } }],
    });
  });

  it("does not match on mbankCategory so manual categories stay safe", () => {
    const where = buildAiUncategorizedWhere("ws-1", ["bez-1"]);
    const serialized = JSON.stringify(where);
    expect(serialized).not.toContain("mbankCategory");
    expect(where.OR).toEqual([{ categoryId: null }, { categoryId: { in: ["bez-1"] } }]);
  });

  it("omits categoryId-in clause when no Bez kategorii buckets exist", () => {
    expect(buildAiUncategorizedWhere("ws-1", [])).toEqual({
      workspaceId: "ws-1",
      OR: [{ categoryId: null }],
    });
  });
});
