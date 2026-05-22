"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActionError } from "@/lib/logger";
import { runCsvImport } from "@/server/actions/run-csv-import";

export type ImportCsvResult =
  | { ok: true; newCount: number; skippedCount: number }
  | { ok: false; error: string };

async function getWorkspaceId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  return session.user.workspaceId;
}

export async function importCsv(formData: FormData): Promise<ImportCsvResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  const accountIdRaw = formData.get("accountId");
  const accountId = typeof accountIdRaw === "string" ? accountIdRaw : "";
  const file = formData.get("file");
  if (!accountId || !(file instanceof File)) {
    return { ok: false, error: "Wybierz konto i plik CSV" };
  }

  const account = await prisma.account.findFirst({
    where: { id: accountId, workspaceId },
  });
  if (!account) {
    return { ok: false, error: "Nie znaleziono konta" };
  }

  try {
    const result = await runCsvImport({ workspaceId, accountId, file });
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    return result;
  } catch (error) {
    return {
      ok: false,
      error: logActionError("import.csv", error, {
        context: { workspaceId, accountId, fileName: file.name },
        fallbackMessage: "Błąd importu",
      }),
    };
  }
}
