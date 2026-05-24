"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActionError } from "@/lib/logger";
import { persistAcceptRecurringOpportunity } from "@/lib/recurring/persist-accept-recurring";

export type RecurringActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

async function getWorkspaceId(): Promise<string | null> {
  const session = await auth();
  return session?.user.workspaceId ?? null;
}

function revalidateRecurringPaths(): void {
  revalidatePath("/recurring");
  revalidatePath("/dashboard");
  revalidatePath("/optimize");
  revalidatePath("/transactions");
}

export async function acceptRecurringOpportunity(
  opportunityId: string,
): Promise<RecurringActionResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  try {
    const opportunity = await prisma.optimizationOpportunity.findFirst({
      where: {
        id: opportunityId,
        workspaceId,
        type: { in: ["RECURRING", "SUBSCRIPTION"] },
        status: "OPEN",
      },
    });
    if (!opportunity) {
      return { ok: false, error: "Nie znaleziono otwartego podejrzenia" };
    }

    await persistAcceptRecurringOpportunity(workspaceId, opportunity);
    revalidateRecurringPaths();
    return { ok: true, message: "Zaakceptowano — oznaczono jako subskrypcję." };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("recurring.accept", error, {
        context: { workspaceId, opportunityId },
        fallbackMessage: "Nie udało się zaakceptować sugestii",
      }),
    };
  }
}

export async function dismissRecurringOpportunity(
  opportunityId: string,
): Promise<RecurringActionResult> {
  const workspaceId = await getWorkspaceId();
  if (!workspaceId) {
    return { ok: false, error: "Brak sesji" };
  }

  try {
    const updated = await prisma.optimizationOpportunity.updateMany({
      where: {
        id: opportunityId,
        workspaceId,
        type: { in: ["RECURRING", "SUBSCRIPTION"] },
        status: "OPEN",
      },
      data: {
        status: "DISMISSED",
        resolvedAt: new Date(),
        followUpNote: "Odrzucone przez użytkownika",
      },
    });
    if (updated.count === 0) {
      return { ok: false, error: "Nie znaleziono otwartego podejrzenia" };
    }
    revalidateRecurringPaths();
    return { ok: true, message: "Odrzucono sugestię." };
  } catch (error) {
    return {
      ok: false,
      error: logActionError("recurring.dismiss", error, {
        context: { workspaceId, opportunityId },
        fallbackMessage: "Nie udało się odrzucić sugestii",
      }),
    };
  }
}
