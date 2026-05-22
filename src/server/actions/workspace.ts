"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActionError } from "@/lib/logger";

export type WorkspaceActionResult = { ok: true } | { ok: false; error: string };

async function getWorkspaceId(): Promise<string | null> {
  const session = await auth();
  return session?.user.workspaceId ?? null;
}

const createAccountSchema = z.object({
  name: z.string().trim().min(1, "Podaj nazwę konta"),
  type: z.enum(["firma", "dom"]),
});

export async function createAccount(formData: FormData): Promise<WorkspaceActionResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  const parsed = createAccountSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Błąd walidacji" };
  }

  try {
    await prisma.account.create({
      data: { workspaceId, name: parsed.data.name, type: parsed.data.type },
    });
    revalidatePath("/settings");
    revalidatePath("/import");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("workspace.createAccount", error, {
        context: { workspaceId },
      }),
    };
  }
}

const deleteDataSchema = z.object({
  confirmName: z.string().trim().min(1),
});

export async function deleteAllWorkspaceData(
  formData: FormData,
): Promise<WorkspaceActionResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) {
    return { ok: false, error: "Nie znaleziono workspace" };
  }

  const parsed = deleteDataSchema.safeParse({ confirmName: formData.get("confirmName") });
  if (!parsed.success) {
    return { ok: false, error: "Wpisz nazwę workspace, aby potwierdzić" };
  }
  if (parsed.data.confirmName !== workspace.name) {
    return { ok: false, error: "Nazwa nie zgadza się — usuwanie anulowane" };
  }

  try {
    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { workspaceId } }),
      prisma.importBatch.deleteMany({ where: { workspaceId } }),
      prisma.merchantCategoryMemory.deleteMany({ where: { workspaceId } }),
      prisma.categoryRule.deleteMany({ where: { workspaceId } }),
    ]);
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/import");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("workspace.deleteData", error, { context: { workspaceId } }),
    };
  }
}
