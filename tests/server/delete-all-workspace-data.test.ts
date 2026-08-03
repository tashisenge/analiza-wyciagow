import { beforeEach, describe, expect, it, vi } from "vitest";

const runWipeMock = vi.fn().mockResolvedValue(undefined);
const workspaceFindUnique = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    workspace: {
      findUnique: (...args: unknown[]) => workspaceFindUnique(...args),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { workspaceId: "ws-mine" } }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/workspace/build-delete-all-workspace-data-ops", () => ({
  runDeleteAllWorkspaceData: (...args: unknown[]) => runWipeMock(...args),
}));

import { deleteAllWorkspaceData } from "@/server/actions/workspace";

function formWithName(name: string): FormData {
  const formData = new FormData();
  formData.set("confirmName", name);
  return formData;
}

describe("deleteAllWorkspaceData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    workspaceFindUnique.mockResolvedValue({ id: "ws-mine", name: "Nasze finanse" });
  });

  it("rejects mismatched confirmation name without wiping", async () => {
    const result = await deleteAllWorkspaceData(formWithName("zla-nazwa"));

    expect(result).toEqual({
      ok: false,
      error: "Nazwa nie zgadza się — usuwanie anulowane",
    });
    expect(runWipeMock).not.toHaveBeenCalled();
  });

  it("runs scoped wipe after matching confirmation", async () => {
    const result = await deleteAllWorkspaceData(formWithName("Nasze finanse"));

    expect(result).toEqual({ ok: true });
    expect(runWipeMock).toHaveBeenCalledWith(expect.anything(), "ws-mine");
  });
});
