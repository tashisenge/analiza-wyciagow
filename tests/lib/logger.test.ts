import { describe, expect, it, vi } from "vitest";

import { logger, serializeError } from "@/lib/logger";

describe("serializeError", () => {
  it("extracts message and stack from Error", () => {
    const err = new Error("test failure");
    const serialized = serializeError(err);
    expect(serialized.name).toBe("Error");
    expect(serialized.message).toBe("test failure");
    expect(serialized.stack).toBeDefined();
  });

  it("stringifies unknown values", () => {
    expect(serializeError(42).message).toBe("42");
  });
});

describe("logger", () => {
  it("writes JSON to console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    logger.error("import failed", {
      context: { workspaceId: "ws1" },
      error: new Error("boom"),
    });
    expect(spy).toHaveBeenCalledOnce();
    const line = spy.mock.calls[0]?.[0];
    expect(typeof line).toBe("string");
    const parsed = JSON.parse(String(line)) as {
      level: string;
      msg: string;
      err: { message: string };
    };
    expect(parsed.level).toBe("error");
    expect(parsed.msg).toBe("import failed");
    expect(parsed.err.message).toBe("boom");
    spy.mockRestore();
  });
});
