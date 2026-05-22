import { prisma } from "../src/lib/db";
import { assignMbankCategoriesForWorkspace } from "../src/lib/mbank/sync-categories";

async function main(): Promise<void> {
  const workspace = await prisma.workspace.findFirst();
  if (!workspace) {
    console.log("Brak workspace — uruchom npm run demo:seed");
    return;
  }

  const updated = await assignMbankCategoriesForWorkspace(workspace.id);
  const categories = await prisma.category.count({
    where: { workspaceId: workspace.id },
  });
  const transactions = await prisma.transaction.count({
    where: { workspaceId: workspace.id },
  });

  console.log(
    `Kategorie w workspace: ${String(categories)}, transakcje: ${String(transactions)}, zaktualizowano: ${String(updated)}`,
  );
}

main().finally(() => prisma.$disconnect());
