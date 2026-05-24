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

function revalidateSubscriptionPaths(): void {
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/optimize");
}

export async function markCounterpartyAsSubscription(
  counterparty: string,
  note?: string,
): Promise<{ ok: boolean; error?: string }> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }
  const trimmed = counterparty.trim();
  if (!trimmed) {
    return { ok: false, error: "Brak kontrahenta" };
  }
  try {
    await prisma.subscriptionMarker.upsert({
      where: { workspaceId_counterparty: { workspaceId, counterparty: trimmed } },
      create: { workspaceId, counterparty: trimmed, note: note?.trim() ?? null },
      update: { note: note?.trim() ?? null },
    });
    revalidateSubscriptionPaths();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("subscriptions.mark", error, {
        context: { workspaceId, counterparty: trimmed },
        fallbackMessage: "Nie udało się oznaczyć subskrypcji",
      }),
    };
  }
}

export async function unmarkCounterpartySubscription(
  counterparty: string,
): Promise<{ ok: boolean; error?: string }> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }
  const trimmed = counterparty.trim();
  if (!trimmed) {
    return { ok: false, error: "Brak kontrahenta" };
  }
  try {
    await prisma.subscriptionMarker.deleteMany({
      where: { workspaceId, counterparty: trimmed },
    });
    revalidateSubscriptionPaths();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("subscriptions.unmark", error, {
        context: { workspaceId, counterparty: trimmed },
        fallbackMessage: "Nie udało się usunąć oznaczenia subskrypcji",
      }),
    };
  }
}
