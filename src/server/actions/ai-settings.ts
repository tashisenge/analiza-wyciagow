"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { listAvailableAiProviders } from "@/lib/ai/resolve-workspace-ai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActionError } from "@/lib/logger";

export type AiSettingsResult = { ok: true } | { ok: false; error: string };

async function getWorkspaceId(): Promise<string | null> {
  const session = await auth();
  return session?.user.workspaceId ?? null;
}

const providerSchema = z.enum(["auto", "anthropic", "openai"]);

export async function updateAiProviderPreference(
  formData: FormData,
): Promise<AiSettingsResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  const parsed = providerSchema.safeParse(formData.get("preference"));
  if (!parsed.success) {
    return { ok: false, error: "Nieprawidłowy provider" };
  }

  if (parsed.data !== "auto") {
    const available = listAvailableAiProviders();
    if (!available.includes(parsed.data)) {
      return {
        ok: false,
        error: `Brak klucza API dla ${parsed.data}. Dodaj klucz w .env / Vercel.`,
      };
    }
  }

  try {
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { aiProviderPreference: parsed.data },
    });
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("ai.updateProvider", error, { context: { workspaceId } }),
    };
  }
}

export async function updateAnalysisExcludedCategories(
  formData: FormData,
): Promise<AiSettingsResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  const raw = formData.getAll("excludedCategoryId");
  const ids = raw.filter((value): value is string => typeof value === "string");

  try {
    const valid = await prisma.category.findMany({
      where: { workspaceId, id: { in: ids } },
      select: { id: true },
    });
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        analysisExcludedCategoryIds: valid.map((category) => category.id),
      },
    });
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("ai.updateExclusions", error, { context: { workspaceId } }),
    };
  }
}
