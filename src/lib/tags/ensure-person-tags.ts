import { prisma } from "@/lib/db";

export const PERSON_TAG_NAMES = ["Adam", "Żona"] as const;

const PERSON_TAG_COLORS: Record<(typeof PERSON_TAG_NAMES)[number], string> = {
  Adam: "#3b82f6",
  Żona: "#ec4899",
};

/** Tworzy tagi Adam / Żona jeśli brak — do filtrowania wydatków per osoba przy wspólnym koncie. */
export async function ensurePersonTags(workspaceId: string): Promise<void> {
  for (const name of PERSON_TAG_NAMES) {
    await prisma.tag.upsert({
      where: { workspaceId_name: { workspaceId, name } },
      create: {
        workspaceId,
        name,
        color: PERSON_TAG_COLORS[name],
      },
      update: {},
    });
  }
}
