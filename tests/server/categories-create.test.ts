import { beforeEach, describe, expect, it, vi } from "vitest";

const categoryCreate = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    category: {
      create: (...args: unknown[]) => categoryCreate(...args),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { workspaceId: "ws-mine" } }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("@/lib/mbank/category-colors", () => ({
  colorForMbankCategory: vi.fn().mockReturnValue("#6366f1"),
}));

import { createCategory } from "@/server/actions/categories";

describe("createCategory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    categoryCreate.mockResolvedValue({ id: "cat-new" });
  });

  it("rejects empty name", async () => {
    const formData = new FormData();
    formData.set("name", "   ");

    const result = await createCategory(formData);

    expect(result).toEqual({ ok: false, error: "Podaj nazwę" });
    expect(categoryCreate).not.toHaveBeenCalled();
  });

  it("creates user category with isDefault false", async () => {
    const formData = new FormData();
    formData.set("name", "  Moja kategoria  ");
    formData.set("color", "#ff0000");

    const result = await createCategory(formData);

    expect(result).toEqual({ ok: true });
    expect(categoryCreate).toHaveBeenCalledWith({
      data: {
        workspaceId: "ws-mine",
        name: "Moja kategoria",
        color: "#ff0000",
        isDefault: false,
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/categories");
    expect(revalidatePath).toHaveBeenCalledWith("/transactions");
  });

  it("uses generated color when color omitted", async () => {
    const formData = new FormData();
    formData.set("name", "Inna");

    await createCategory(formData);

    expect(categoryCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        color: "#6366f1",
        isDefault: false,
      }),
    });
  });
});
