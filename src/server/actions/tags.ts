"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActionError } from "@/lib/logger";

async function getWorkspaceId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  return session.user.workspaceId;
}

function revalidateTagPaths(): void {
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

export async function createTag(name: string, color?: string): Promise<{ ok: boolean; error?: string; id?: string }> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: "Podaj nazwę tagu" };
  }
  try {
    const tag = await prisma.tag.upsert({
      where: { workspaceId_name: { workspaceId, name: trimmed } },
      create: { workspaceId, name: trimmed, color: color ?? "#6366f1" },
      update: {},
      select: { id: true },
    });
    revalidateTagPaths();
    return { ok: true, id: tag.id };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("tags.create", error, {
        context: { workspaceId },
        fallbackMessage: "Nie udało się utworzyć tagu",
      }),
    };
  }
}

export async function assignTagsToTransaction(
  transactionId: string,
  tagIds: string[],
): Promise<{ ok: boolean; error?: string }> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }
  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, workspaceId },
      select: { id: true },
    });
    if (!transaction) {
      return { ok: false, error: "Nie znaleziono transakcji" };
    }
    const validTags = await prisma.tag.findMany({
      where: { workspaceId, id: { in: tagIds } },
      select: { id: true },
    });
    await prisma.$transaction([
      prisma.transactionTag.deleteMany({ where: { transactionId } }),
      ...validTags.map((tag) =>
        prisma.transactionTag.create({
          data: { transactionId, tagId: tag.id },
        }),
      ),
    ]);
    revalidateTagPaths();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("tags.assign", error, {
        context: { workspaceId, transactionId },
        fallbackMessage: "Nie udało się przypisać tagów",
      }),
    };
  }
}

export async function deleteTag(tagId: string): Promise<{ ok: boolean; error?: string }> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }
  try {
    await prisma.tag.deleteMany({ where: { id: tagId, workspaceId } });
    revalidateTagPaths();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("tags.delete", error, {
        context: { workspaceId, tagId },
        fallbackMessage: "Nie udało się usunąć tagu",
      }),
    };
  }
}
