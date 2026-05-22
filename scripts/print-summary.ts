import { prisma } from "../src/lib/db";

async function main(): Promise<void> {
  const workspace = await prisma.workspace.findFirst();
  if (!workspace) {
    console.log("Brak workspace");
    return;
  }
  const txs = await prisma.transaction.findMany({ where: { workspaceId: workspace.id } });
  const expenses = txs.filter((tx) => Number(tx.amount) < 0);
  const income = txs.filter((tx) => Number(tx.amount) > 0);
  const totalExp = expenses.reduce((s, tx) => s + Math.abs(Number(tx.amount)), 0);
  const totalInc = income.reduce((s, tx) => s + Number(tx.amount), 0);

  const byCat = new Map<string, number>();
  for (const tx of expenses) {
    const key = tx.mbankCategory || "?";
    byCat.set(key, (byCat.get(key) ?? 0) + Math.abs(Number(tx.amount)));
  }
  const sorted = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);

  console.log("\n=== CAŁY ZAIMPORTOWANY OKRES ===");
  console.log(`Transakcji: ${String(txs.length)}`);
  console.log(`Wydatki: ${totalExp.toFixed(2)} PLN | Wpływy: ${totalInc.toFixed(2)} PLN`);
  console.log("\nTop 15 kategorii mBank (wydatki):");
  for (const [name, total] of sorted) {
    const pct = ((total / totalExp) * 100).toFixed(1);
    console.log(`  ${total.toFixed(2)} PLN (${pct}%) — ${name}`);
  }
}

main().finally(() => prisma.$disconnect());
